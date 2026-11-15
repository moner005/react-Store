import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Db, MongoClient } from 'mongodb'
import type { AppConfig } from '../config/app-config.js'
import { APP_CONFIG } from '../config/config-token.js'

const SERVER_SELECTION_TIMEOUT_MS = 1_500
const CONNECTION_TIMEOUT_MS = 1_500
const OPERATION_TIMEOUT_MS = 2_000

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly client: MongoClient
  private connectionCheck: Promise<boolean> | undefined

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.client = new MongoClient(config.mongoUri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      connectTimeoutMS: CONNECTION_TIMEOUT_MS,
      socketTimeoutMS: OPERATION_TIMEOUT_MS,
      waitQueueTimeoutMS: OPERATION_TIMEOUT_MS,
      maxPoolSize: 10,
    })
  }

  async getDatabase(): Promise<Db> {
    await this.client.connect()
    return this.client.db(this.config.mongoDatabase)
  }

  onModuleInit(): void {
    // Database availability must not prevent the HTTP health endpoint from starting.
    void this.isReady()
  }

  isReady(): Promise<boolean> {
    if (!this.connectionCheck) {
      this.connectionCheck = this.pingDatabase().finally(() => {
        this.connectionCheck = undefined
      })
    }
    return this.connectionCheck
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connectionCheck) await this.connectionCheck
    try {
      await this.client.close()
    } catch {
      // Shutdown should not leak driver details or block the rest of app cleanup.
    }
  }

  private async pingDatabase(): Promise<boolean> {
    try {
      const database = await this.getDatabase()
      await database.command({ ping: 1 }, { timeoutMS: OPERATION_TIMEOUT_MS })
      return true
    } catch {
      return false
    }
  }
}
