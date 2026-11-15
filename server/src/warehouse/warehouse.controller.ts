import { BadRequestException, Body, Controller, Get, Inject, Param, Put, Query, Req, UseGuards } from '@nestjs/common'
import { requireOwner, SessionGuard, StoreOriginGuard, type SessionRequest } from '../auth/auth.http.js'
import { WarehouseService } from './warehouse.service.js'

@Controller('api/v1/management/warehouse')
@UseGuards(SessionGuard)
export class WarehouseController {
  constructor(@Inject(WarehouseService) private readonly warehouse: WarehouseService) {}

  @Get()
  overview(@Req() request: SessionRequest) {
    requireOwner(request)
    return this.warehouse.overview()
  }

  @Get('products')
  products(@Req() request: SessionRequest, @Query('q') query: unknown = '') {
    requireOwner(request)
    if (typeof query !== 'string') throw new BadRequestException()
    const q = query.trim()
    if (q.length < 2) return []
    if (q.length > 100) throw new BadRequestException()
    return this.warehouse.searchProducts(q)
  }

  @Put('receipts/:requestId')
  @UseGuards(StoreOriginGuard)
  receive(@Req() request: SessionRequest, @Param('requestId') requestId: string, @Body() body: unknown) {
    const owner = requireOwner(request)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      throw new BadRequestException()
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new BadRequestException()
    const input = body as Record<string, unknown>
    if (Object.keys(input).length !== 2 || !Object.hasOwn(input, 'productId') || !Object.hasOwn(input, 'quantity')
      || typeof input.productId !== 'string' || !/^[a-f0-9]{28}$/.test(input.productId)
      || !Number.isInteger(input.quantity) || (input.quantity as number) < 1 || (input.quantity as number) > 10_000) {
      throw new BadRequestException()
    }
    return this.warehouse.receive(requestId.toLowerCase(), input.productId, input.quantity as number, owner)
  }
}
