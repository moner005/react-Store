#!/usr/bin/env python3
"""Small, explicit MongoDB administration CLI with dry-run mutations."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

from bson import json_util
from bson.json_util import CANONICAL_JSON_OPTIONS
from pymongo import DeleteOne, InsertOne, MongoClient, UpdateOne
from pymongo.collation import Collation
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import BulkWriteError
from pymongo.write_concern import WriteConcern


SYSTEM_DATABASES = {"admin", "config", "local"}
SIMPLE_COLLATION = Collation("simple")


class CliError(Exception):
    pass


def add_filter_argument(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--filter", default="{}", help="JSON or Extended JSON object (default: {})")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="MongoDB admin tool; writes are dry-run by default.")
    parser.add_argument("--db", default=os.environ.get("MONGO_DATABASE"), help="Database name (or MONGO_DATABASE)")
    commands = parser.add_subparsers(dest="command", required=True)

    commands.add_parser("collections", help="List collection names")

    find_parser = commands.add_parser("find", help="Print matching documents")
    find_parser.add_argument("collection")
    add_filter_argument(find_parser)
    find_parser.add_argument("--limit", type=int, default=20)

    count_parser = commands.add_parser("count", help="Count matching documents")
    count_parser.add_argument("collection")
    add_filter_argument(count_parser)

    export_parser = commands.add_parser("export", help="Export matching documents as canonical Extended JSON")
    export_parser.add_argument("collection")
    add_filter_argument(export_parser)
    export_parser.add_argument("--out", required=True)

    insert_parser = commands.add_parser("insert", help="Insert a JSON array of documents")
    insert_parser.add_argument("collection")
    insert_parser.add_argument("--file", required=True)
    insert_parser.add_argument("--apply", action="store_true")

    update_parser = commands.add_parser("update", help="Set or remove fields on exactly the selected documents")
    update_parser.add_argument("collection")
    add_filter_argument(update_parser)
    update_parser.add_argument("--set", dest="set_json", help="JSON object of fields to set")
    update_parser.add_argument("--unset", action="append", default=[], metavar="FIELD", help="Field to remove (repeatable)")
    update_parser.add_argument("--apply", action="store_true")
    update_parser.add_argument("--expect-count", type=int)
    update_parser.add_argument("--backup")

    delete_parser = commands.add_parser("delete", help="Delete exactly the selected documents")
    delete_parser.add_argument("collection")
    add_filter_argument(delete_parser)
    delete_parser.add_argument("--apply", action="store_true")
    delete_parser.add_argument("--expect-count", type=int)
    delete_parser.add_argument("--backup")
    return parser


def parse_object(raw: str, label: str) -> dict[str, Any]:
    try:
        value = json_util.loads(raw)
    except Exception as exc:
        raise CliError(f"{label} must be valid JSON or Extended JSON") from exc
    if not isinstance(value, dict):
        raise CliError(f"{label} must be a JSON object")
    return value


def parse_document_array(path: str) -> list[dict[str, Any]]:
    try:
        value = json_util.loads(Path(path).read_text(encoding="utf-8"))
    except Exception as exc:
        raise CliError("Could not read a valid JSON/Extended JSON document array") from exc
    if not isinstance(value, list) or any(not isinstance(item, dict) for item in value):
        raise CliError("Input file must contain an array of JSON documents")
    return value


def require_collection_name(name: str) -> None:
    if not name or name.startswith("system.") or "\x00" in name:
        raise CliError("A non-system collection name is required")


def require_writable_database(name: str) -> None:
    if name in SYSTEM_DATABASES:
        raise CliError("Writes to system databases are blocked")


def require_nonempty_filter(filter_doc: dict[str, Any]) -> None:
    if not filter_doc:
        raise CliError("Update and delete require a nonempty --filter")


def update_document(args: argparse.Namespace) -> dict[str, Any]:
    fields_to_set = parse_object(args.set_json, "--set") if args.set_json is not None else {}
    fields_to_unset = dict.fromkeys(args.unset, "")
    if not fields_to_set and not fields_to_unset:
        raise CliError("Provide --set with a nonempty object or one or more --unset fields")
    for field in fields_to_set.keys() | fields_to_unset.keys():
        if field.split(".")[0] == "_id" or any(not part or part.startswith("$") or "\x00" in part for part in field.split(".")):
            raise CliError("Update contains a protected or invalid field name")
    if fields_to_set.keys() & fields_to_unset.keys():
        raise CliError("A field cannot be both set and removed")
    update = {}
    if fields_to_set:
        update["$set"] = fields_to_set
    if fields_to_unset:
        update["$unset"] = fields_to_unset
    return update


def encode_documents(documents: list[dict[str, Any]]) -> str:
    return json_util.dumps(documents, json_options=CANONICAL_JSON_OPTIONS, indent=2) + "\n"


def write_exclusive(path_text: str, content: str) -> None:
    path = Path(path_text)
    try:
        with path.open("x", encoding="utf-8", newline="\n") as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
    except FileExistsError as exc:
        raise CliError("Output/backup path already exists; choose a new path") from exc
    except OSError as exc:
        raise CliError("Could not create output/backup file") from exc


def captured_documents(collection: Collection, filter_doc: dict[str, Any], expected: int) -> list[dict[str, Any]]:
    if expected < 0:
        raise CliError("--expect-count must be zero or greater")
    documents = list(collection.find(filter_doc, collation=SIMPLE_COLLATION).limit(expected + 1))
    if len(documents) != expected:
        found = f"at least {expected + 1}" if len(documents) > expected else str(len(documents))
        raise CliError(f"Expected {expected} matching documents; found {found}")
    if any("_id" not in document for document in documents):
        raise CliError("A selected document is missing its _id")
    return documents


def preimage_filter(original: dict[str, Any], filter_doc: dict[str, Any]) -> dict[str, Any]:
    return {"$and": [
        filter_doc,
        {"_id": {"$eq": original["_id"]}},
        {"$expr": {"$eq": ["$$ROOT", {"$literal": original}]}},
    ]}


def report_bulk_failure(exc: BulkWriteError, operation: str) -> int:
    details = exc.details if isinstance(exc.details, dict) else {}
    fields = {
        "Update": {"matched": "nMatched", "modified": "nModified"},
        "Delete": {"deleted": "nRemoved"},
        "Insert": {"inserted": "nInserted"},
    }[operation]
    counts = ", ".join(f"{label}={safe_int(details.get(key))}" for label, key in fields.items())
    write_errors = details.get("writeErrors", [])
    failed = len(write_errors) if isinstance(write_errors, list) else 0
    concern_errors = details.get("writeConcernErrors", [])
    unknown = bool(concern_errors)
    phrase = "outcome may be unknown" if unknown else "stopped at a write error"
    print(f"{operation} {phrase}: {counts}, write_errors={failed}. Check the collection before retrying.", file=sys.stderr)
    return 1


def safe_int(value: Any) -> int:
    return value if isinstance(value, int) and value >= 0 else 0


def handle(args: argparse.Namespace, database: Database) -> int:
    if args.command == "collections":
        print(json_util.dumps(sorted(database.list_collection_names())))
        return 0

    collection_name = args.collection
    require_collection_name(collection_name)
    if args.command in {"insert", "update", "delete"}:
        require_writable_database(args.db)
    collection = database[collection_name]

    if args.command in {"find", "count", "export", "update", "delete"}:
        filter_doc = parse_object(args.filter, "--filter")
    if args.command == "find":
        if args.limit < 1 or args.limit > 10_000:
            raise CliError("--limit must be between 1 and 10000")
        print(encode_documents(list(collection.find(filter_doc, collation=SIMPLE_COLLATION).limit(args.limit))), end="")
        return 0
    if args.command == "count":
        print(collection.count_documents(filter_doc, collation=SIMPLE_COLLATION))
        return 0
    if args.command == "export":
        documents = list(collection.find(filter_doc, collation=SIMPLE_COLLATION))
        write_exclusive(args.out, encode_documents(documents))
        print(f"Exported {len(documents)} documents from {args.db}.{collection_name}")
        return 0
    if args.command == "insert":
        documents = parse_document_array(args.file)
        print(f"{'Applying' if args.apply else 'Dry run:'} insert {len(documents)} documents into {args.db}.{collection_name}")
        if args.apply and documents:
            try:
                result = collection.with_options(write_concern=WriteConcern(w="majority")).bulk_write(
                    [InsertOne(document) for document in documents], ordered=True,
                )
                print(f"Inserted {safe_int(result.inserted_count)} documents")
            except BulkWriteError as exc:
                return report_bulk_failure(exc, "Insert")
            except Exception:
                print("Insert outcome may be unknown; inspect the collection before retrying.", file=sys.stderr)
                return 1
        return 0
    if args.command in {"update", "delete"}:
        require_nonempty_filter(filter_doc)
        update = update_document(args) if args.command == "update" else None
        if not args.apply:
            count = collection.count_documents(filter_doc, collation=SIMPLE_COLLATION)
            action = "update" if args.command == "update" else "delete"
            print(f"Dry run: {action} {count} documents in {args.db}.{collection_name}")
            return 0
        if args.expect_count is None or not args.backup:
            raise CliError("--apply requires --expect-count N and a new --backup FILE")
        originals = captured_documents(collection, filter_doc, args.expect_count)
        write_exclusive(args.backup, encode_documents(originals))
        print(f"Applying {args.command} to {len(originals)} documents in {args.db}.{collection_name}; backup saved", flush=True)
        if update is not None:
            operations = [UpdateOne(preimage_filter(doc, filter_doc), update, upsert=False, collation=SIMPLE_COLLATION) for doc in originals]
            if not operations:
                print("Update result: matched=0, modified=0, expected=0")
                return 0
            try:
                result = collection.with_options(write_concern=WriteConcern(w="majority")).bulk_write(operations, ordered=True)
            except BulkWriteError as exc:
                return report_bulk_failure(exc, "Update")
            except Exception:
                print("Update outcome may be unknown; inspect the collection before retrying. Backup retained.", file=sys.stderr)
                return 1
            matched = result.matched_count
            modified = result.modified_count
            print(f"Update result: matched={matched}, modified={modified}, expected={len(originals)}")
            if matched != len(originals):
                print("Some captured documents changed before update; backup retained.", file=sys.stderr)
                return 1
            return 0
        operations = [DeleteOne(preimage_filter(doc, filter_doc), collation=SIMPLE_COLLATION) for doc in originals]
        if not operations:
            print("Delete result: deleted=0, expected=0")
            return 0
        try:
            result = collection.with_options(write_concern=WriteConcern(w="majority")).bulk_write(operations, ordered=True)
        except BulkWriteError as exc:
            return report_bulk_failure(exc, "Delete")
        except Exception:
            print("Delete outcome may be unknown; inspect the collection before retrying. Backup retained.", file=sys.stderr)
            return 1
        deleted = result.deleted_count
        print(f"Delete result: deleted={deleted}, expected={len(originals)}")
        if deleted != len(originals):
            print("Some captured documents changed before delete; backup retained.", file=sys.stderr)
            return 1
        return 0
    raise CliError("Unknown command")


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if not args.db:
        parser.error("--db is required unless MONGO_DATABASE is set")
    uri = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017")
    try:
        with MongoClient(uri, serverSelectionTimeoutMS=4_000, connectTimeoutMS=4_000, retryWrites=False) as client:
            return handle(args, client[args.db])
    except CliError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except Exception:
        print("MongoDB operation failed; connection details were omitted.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
