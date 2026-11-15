import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { AppConfig } from '../config/app-config.js'
import { APP_CONFIG } from '../config/config-token.js'
import { AuthService } from './auth.service.js'
import { asObject, credentials, loginInput } from './auth.input.js'
import {
  readSessionCookie, requireAccount, SessionGuard, StoreOriginGuard, writeSessionCookie,
  type CookieResponse, type SessionRequest,
} from './auth.http.js'

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('register')
  @UseGuards(StoreOriginGuard)
  register(@Body() body: unknown) {
    return this.auth.register(credentials(asObject(body, ['name', 'email', 'password'])))
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(StoreOriginGuard)
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: CookieResponse) {
    const { account, token } = await this.auth.login(loginInput(asObject(body, ['email', 'password'])))
    writeSessionCookie(response, token, this.config.clientOrigin)
    return account
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@Req() request: SessionRequest) {
    return requireAccount(request)
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(StoreOriginGuard)
  async logout(@Req() request: SessionRequest, @Res({ passthrough: true }) response: CookieResponse) {
    const token = readSessionCookie(request)
    if (token) await this.auth.logout(token)
    writeSessionCookie(response, '', this.config.clientOrigin)
  }
}
