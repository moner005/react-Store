import { BadRequestException, Body, Controller, ForbiddenException, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from '../auth/auth.service.js'
import { asObject, branchId, credentials, textField } from '../auth/auth.input.js'
import { requireAccount, requireOwner, SessionGuard, StoreOriginGuard, type SessionRequest } from '../auth/auth.http.js'
import type { BranchId } from '../auth/auth.types.js'
import { BranchService } from './branch.service.js'

@Controller('api/v1/management')
@UseGuards(SessionGuard)
export class ManagementController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(BranchService) private readonly branches: BranchService,
  ) {}

  @Get('dashboard')
  async dashboard(@Req() request: SessionRequest) {
    requireOwner(request)
    return { branches: await this.branches.list() }
  }

  @Get('branches/:id')
  async getBranch(@Req() request: SessionRequest, @Param('id') rawId: string) {
    const id = requireBranch(request, rawId)
    return this.branches.get(id)
  }

  @Patch('branches/:id')
  @UseGuards(StoreOriginGuard)
  async updateBranch(@Req() request: SessionRequest, @Param('id') rawId: string, @Body() body: unknown) {
    const id = requireBranch(request, rawId)
    const input = asObject(body, ['address', 'phone', 'openingHours'])
    const settings = {
      address: textField(input.address, 240),
      phone: textField(input.phone, 40),
      openingHours: textField(input.openingHours, 160),
    }
    return this.branches.update(id, settings)
  }

  @Get('admins')
  listAdmins(@Req() request: SessionRequest) {
    requireOwner(request)
    return this.auth.listAdmins()
  }

  @Post('admins')
  @UseGuards(StoreOriginGuard)
  createAdmin(@Req() request: SessionRequest, @Body() body: unknown) {
    requireOwner(request)
    const input = asObject(body, ['name', 'email', 'password', 'branchId'])
    return this.auth.createAdmin({ ...credentials(input), branchId: branchId(input.branchId) })
  }

  @Patch('admins/:id')
  @UseGuards(StoreOriginGuard)
  updateAdmin(@Req() request: SessionRequest, @Param('id') id: string, @Body() body: unknown) {
    requireOwner(request)
    const input = asObject(body, ['branchId', 'active'])
    const update: { branchId?: BranchId; active?: boolean } = {}
    if (input.branchId !== undefined) update.branchId = branchId(input.branchId)
    if (typeof input.active === 'boolean') update.active = input.active
    else if (input.active !== undefined) throw new BadRequestException()
    if (!Object.keys(update).length) throw new BadRequestException()
    return this.auth.updateAdmin(id, update)
  }
}

function requireBranch(request: SessionRequest, rawId: string): BranchId {
  const account = requireAccount(request)
  const id = branchId(rawId)
  if (account.role === 'owner' || (account.role === 'admin' && account.branchId === id)) return id
  throw new ForbiddenException()
}
