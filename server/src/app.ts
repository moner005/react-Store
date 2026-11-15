import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import type { INestApplication } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module.js'
import { catalogPhotoDirectory, catalogPhotoPrefix } from './catalog/catalog-photos.js'
import type { AppConfig } from './config/app-config.js'
import { SafeExceptionFilter } from './filters/safe-exception.filter.js'

export async function createApp(config: AppConfig): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.register(config), { logger: false })
  app.enableCors({ origin: config.clientOrigin, credentials: true })
  app.useStaticAssets(catalogPhotoDirectory, { prefix: catalogPhotoPrefix, index: false })
  app.useGlobalFilters(new SafeExceptionFilter())
  await app.init()
  return app
}
