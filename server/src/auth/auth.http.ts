import { ForbiddenException, Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common'
import type { IncomingHttpHeaders } from 'node:http'
import { APP_CONFIG } from '../config/config-token.js'
import type { AppConfig } from '../config/app-config.js'
import { AuthService } from './auth.service.js'
import type { PublicAccount } from './auth.types.js'

const COOKIE_NAME = 'store_session'
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export interface SessionRequest {
  headers: IncomingHttpHeaders
  account?: PublicAccount
}

export interface CookieResponse {
  setHeader(name: string, value: string): void
}

export function readSessionCookie(request: SessionRequest): string {
  const value = request.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(COOKIE_NAME + '='))?.slice(COOKIE_NAME.length + 1)
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : ''
}

export function writeSessionCookie(response: CookieResponse, token: string, origin: string): void {
  const maxAge = token ? SESSION_MAX_AGE_SECONDS : 0
  const secure = origin.startsWith('https://') ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`)
}

@Injectable()
export class StoreOriginGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SessionRequest>()
    if (request.headers.origin !== this.config.clientOrigin) throw new ForbiddenException()
    return true
  }
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>()
    const token = readSessionCookie(request)
    const account = token ? await this.auth.getSession(token) : null
    if (!account) throw new UnauthorizedException()
    request.account = account
    return true
  }
}

export function requireAccount(request: SessionRequest): PublicAccount {
  if (!request.account) throw new UnauthorizedException()
  return request.account
}

export function requireOwner(request: SessionRequest): PublicAccount {
  const account = requireAccount(request)
  if (account.role !== 'owner') throw new ForbiddenException()
  return account
}
