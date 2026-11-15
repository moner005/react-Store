import { BadRequestException } from '@nestjs/common'
import type { BranchId, Credentials } from './auth.types.js'

export function asObject(body: unknown, keys: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !keys.includes(key))) {
    throw new BadRequestException()
  }
  return body as Record<string, unknown>
}

export function branchId(value: unknown): BranchId {
  if (value === 'damascus' || value === 'latakia') return value
  throw new BadRequestException()
}

export function credentials(body: Record<string, unknown>): Credentials {
  const name = textField(body.name, 100)
  if (!name) throw new BadRequestException()
  const { email, password } = loginInput(body)
  if (password.length < 8) throw new BadRequestException()
  return { name, email, password }
}

export function loginInput(body: Record<string, unknown>) {
  const email = textField(body.email, 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 128) {
    throw new BadRequestException()
  }
  return { email, password: body.password }
}

export function textField(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new BadRequestException()
  }
  return value.trim()
}
