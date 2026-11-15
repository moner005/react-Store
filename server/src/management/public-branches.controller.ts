import { Controller, Get, Inject } from '@nestjs/common'
import { BranchService } from './branch.service.js'

@Controller('api/v1/branches')
export class PublicBranchesController {
  constructor(@Inject(BranchService) private readonly branches: BranchService) {}

  @Get()
  async list() {
    return { branches: await this.branches.list() }
  }
}
