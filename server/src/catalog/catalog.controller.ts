import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { CatalogService } from './catalog.service.js'
import { parseCatalogListQuery, validateBrandAndSlug } from './catalog-query.js'

@Controller('api/v1/models')
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.catalog.list(parseCatalogListQuery(query))
  }

  @Get('categories')
  categories() {
    return this.catalog.categories()
  }

  @Get(':brand/:slug')
  detail(@Param('brand') brand: string, @Param('slug') slug: string) {
    validateBrandAndSlug(brand, slug)
    return this.catalog.findOne(brand, slug)
  }
}
