import { Controller, Get, Inject, Res } from '@nestjs/common'
import { MongoService } from '../database/mongo.service.js'

interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): unknown
}

@Controller()
export class ReadinessController {
  constructor(@Inject(MongoService) private readonly mongo: MongoService) {}

  @Get('ready')
  async readiness(@Res() response: ApiResponse) {
    const ready = await this.mongo.isReady()
    if (!ready) return response.status(503).json({ error: { message: 'Database unavailable' } })
    return response.status(200).json({ status: 'ready', service: 'react-store-api' })
  }
}
