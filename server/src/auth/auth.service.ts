import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import type { Collection, Db } from 'mongodb'
import { MongoService } from '../database/mongo.service.js'
import type {
  AccountRole,
  BranchId,
  AuthSession,
  CreateAdminInput,
  LoginCredentials,
  PublicAccount,
  RegisterCustomerInput,
  UpdateAdminInput,
} from './auth.types.js'

const scrypt = promisify(scryptCallback)
const ACCOUNT_COLLECTION = 'accounts'
const SESSION_COLLECTION = 'sessions'
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const SCRYPT_KEY_LENGTH = 64

interface AccountDocument {
  _id: string
  name: string
  email: string
  role: AccountRole
  branchId: BranchId | null
  active: boolean
  sessionVersion: string
  passwordSalt: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

interface SessionDocument {
  _id: string
  tokenHash: string
  accountId: string
  sessionVersion: string
  expiresAt: Date
  createdAt: Date
}

@Injectable()
export class AuthService {
  private indexes: Promise<void> | undefined

  constructor(@Inject(MongoService) private readonly mongo: MongoService) {}

  private ensureIndexes(): Promise<void> {
    this.indexes ??= this.createIndexes().catch((error: unknown) => {
      this.indexes = undefined
      throw error
    })
    return this.indexes
  }

  private async createIndexes(): Promise<void> {
    const database = await this.mongo.getDatabase()
    await database.collection<AccountDocument>(ACCOUNT_COLLECTION).createIndexes([
      { key: { email: 1 }, name: 'accounts_email_unique', unique: true },
      {
        key: { role: 1 },
        name: 'accounts_one_owner_unique',
        unique: true,
        partialFilterExpression: { role: 'owner' },
      },
    ])
    await database.collection<SessionDocument>(SESSION_COLLECTION).createIndexes([
      { key: { tokenHash: 1 }, name: 'sessions_token_hash_unique', unique: true },
      { key: { expiresAt: 1 }, name: 'sessions_expiry_ttl', expireAfterSeconds: 0 },
    ])
  }

  async register(input: RegisterCustomerInput): Promise<PublicAccount> {
    await this.ensureIndexes()
    const database = await this.mongo.getDatabase()
    const account = await makeAccount(input, 'user', null, true)
    try {
      await this.accounts(database).insertOne(account)
    } catch (error) {
      if (isDuplicateKey(error)) throw new ConflictException('Account already exists')
      throw error
    }
    return toPublicAccount(account)
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    await this.ensureIndexes()
    const database = await this.mongo.getDatabase()
    const account = await this.accounts(database).findOne({ email: normalizeEmail(credentials.email) })
    const passwordMatches = await verifyPassword(
      credentials.password,
      account?.passwordSalt ?? '00000000000000000000000000000000',
      account?.passwordHash ?? '00'.repeat(SCRYPT_KEY_LENGTH),
    )
    if (!account?.active || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const token = randomBytes(32).toString('base64url')
    const now = new Date()
    const session: SessionDocument = {
      _id: randomUUID(),
      tokenHash: hashToken(token),
      accountId: account._id,
      sessionVersion: account.sessionVersion,
      createdAt: now,
      expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
    }
    await this.sessions(database).insertOne(session)
    return { token, account: toPublicAccount(account) }
  }

  async getSession(token: string): Promise<PublicAccount | null> {
    if (!isToken(token)) return null
    const database = await this.mongo.getDatabase()
    const session = await this.sessions(database).findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    })
    if (!session) return null
    const account = await this.accounts(database).findOne({
      _id: session.accountId,
      active: true,
      sessionVersion: session.sessionVersion,
    })
    return account ? toPublicAccount(account) : null
  }

  async logout(token: string): Promise<void> {
    if (!isToken(token)) return
    await this.sessions(await this.mongo.getDatabase()).deleteOne({ tokenHash: hashToken(token) })
  }

  async bootstrapOwner(input: RegisterCustomerInput): Promise<PublicAccount> {
    await this.ensureIndexes()
    const database = await this.mongo.getDatabase()
    const accounts = this.accounts(database)
    const existing = await accounts.findOne({ email: normalizeEmail(input.email) })
    if (existing) {
      if (existing.role !== 'owner') throw new ConflictException()
      return toPublicAccount(existing)
    }

    const owner = await makeAccount(input, 'owner', null, true)
    try {
      await accounts.insertOne(owner)
      return toPublicAccount(owner)
    } catch (error) {
      if (isDuplicateKey(error)) {
        const winner = await accounts.findOne({ email: owner.email })
        if (winner?.role === 'owner') return toPublicAccount(winner)
        throw new ConflictException('An owner account already exists')
      }
      throw error
    }
  }

  async listAdmins(): Promise<PublicAccount[]> {
    const admins = await this.accounts(await this.mongo.getDatabase())
      .find({ role: 'admin' }).sort({ email: 1 }).toArray()
    return admins.map(toPublicAccount)
  }

  async createAdmin(input: CreateAdminInput): Promise<PublicAccount> {
    await this.ensureIndexes()
    const database = await this.mongo.getDatabase()
    const admin = await makeAccount(input, 'admin', input.branchId, true)
    try {
      await this.accounts(database).insertOne(admin)
    } catch (error) {
      if (isDuplicateKey(error)) throw new ConflictException('Account already exists')
      throw error
    }
    return toPublicAccount(admin)
  }

  async updateAdmin(id: string, changes: UpdateAdminInput): Promise<PublicAccount> {
    const update: { branchId?: BranchId; active?: boolean; sessionVersion?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    }
    if (changes.branchId !== undefined) update.branchId = changes.branchId
    if (changes.active !== undefined) {
      update.active = changes.active
      update.sessionVersion = randomUUID()
    }
    const account = await this.accounts(await this.mongo.getDatabase()).findOneAndUpdate(
      { _id: id, role: 'admin' },
      { $set: update },
      { returnDocument: 'after' },
    )
    if (!account) throw new NotFoundException('Admin not found')
    return toPublicAccount(account)
  }

  private accounts(database: Db): Collection<AccountDocument> {
    return database.collection<AccountDocument>(ACCOUNT_COLLECTION)
  }

  private sessions(database: Db): Collection<SessionDocument> {
    return database.collection<SessionDocument>(SESSION_COLLECTION)
  }
}

async function makeAccount(
  input: RegisterCustomerInput,
  role: AccountRole,
  branchId: BranchId | null,
  active: boolean,
): Promise<AccountDocument> {
  const passwordSalt = randomBytes(16).toString('hex')
  const passwordHash = await hashPassword(input.password, passwordSalt)
  const now = new Date()
  return {
    _id: randomUUID(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    role,
    branchId,
    active,
    sessionVersion: randomUUID(),
    passwordSalt,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  }
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return (await scrypt(password, salt, SCRYPT_KEY_LENGTH) as Buffer).toString('hex')
}

async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  try {
    const actual = Buffer.from(await hashPassword(password, salt), 'hex')
    const expected = Buffer.from(expectedHash, 'hex')
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function isToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value)
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000
}

function toPublicAccount(account: AccountDocument): PublicAccount {
  return {
    id: account._id,
    name: account.name,
    email: account.email,
    role: account.role,
    branchId: account.branchId,
    active: account.active,
  }
}
