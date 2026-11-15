import { DynamicModule, Module } from '@nestjs/common'
import { HealthController } from './controllers/health.controller.js'
import { ReadinessController } from './controllers/readiness.controller.js'
import type { AppConfig } from './config/app-config.js'
import { APP_CONFIG } from './config/config-token.js'
import { MongoService } from './database/mongo.service.js'
import { AuthService } from './auth/auth.service.js'
import { AuthController } from './auth/auth.controller.js'
import { SessionGuard, StoreOriginGuard } from './auth/auth.http.js'
import { ManagementController } from './management/management.controller.js'
import { CatalogController } from './catalog/catalog.controller.js'
import { CatalogService } from './catalog/catalog.service.js'
import { WarehouseController } from './warehouse/warehouse.controller.js'
import { WarehouseService } from './warehouse/warehouse.service.js'
import { PublicBranchesController } from './management/public-branches.controller.js'
import { BranchService } from './management/branch.service.js'

@Module({
  controllers: [HealthController, ReadinessController, CatalogController, AuthController, ManagementController, WarehouseController, PublicBranchesController],
  providers: [MongoService, CatalogService, AuthService, SessionGuard, StoreOriginGuard, WarehouseService, BranchService],
  exports: [MongoService, CatalogService],
})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      providers: [{ provide: APP_CONFIG, useValue: config }],
    }
  }
}
