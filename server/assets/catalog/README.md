# Catalog photos

Run `npm run seed:photos` from `server/` to save the captured Dials thumbnails into `rolex/`. Pass `-- --limit=24` to import only the first page of models. Completed photos are reused when the command runs again. NestJS serves these files from `/catalog-images/rolex/`.

The source file is [the captured thumbnail index](../../seed/dials-rolex-images.json). Each catalog model links back to its original Dials page. The importer saves local copies and the storefront uses those copies. A watch without a downloaded thumbnail displays a placeholder. [Dials developer terms](https://dials.co/developers#terms)
