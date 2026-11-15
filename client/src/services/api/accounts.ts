import { isAxiosError } from 'axios'
import { apiClient } from '@/services/apiClient'
import type { BranchId, SessionUser } from '@/types/auth'

export interface Registration {
  name: string
  email: string
  password: string
}

export interface BranchSettings {
  address: string
  phone: string
  openingHours: string
}

export interface Branch extends BranchSettings {
  id: BranchId
  name: string
}

const auth = '/api/v1/auth'
const management = '/api/v1/management'
const session = { withCredentials: true }

export function hasStatus(error: unknown, status: number): boolean {
  return isAxiosError(error) && error.response?.status === status
}

export async function registerUser(input: Registration) {
  const response = await apiClient.post<SessionUser>(auth + '/register', input, session)
  return response.data
}

export async function loginUser(email: string, password: string) {
  const response = await apiClient.post<SessionUser>(auth + '/login', { email, password }, session)
  return response.data
}

export async function currentUser() {
  try {
    const response = await apiClient.get<SessionUser>(auth + '/me', session)
    return response.data
  } catch (error) {
    if (hasStatus(error, 401)) return null
    throw error
  }
}

export async function logoutUser() {
  await apiClient.post(auth + '/logout', {}, session)
}

export async function getDashboardBranches(signal: AbortSignal) {
  const response = await apiClient.get<{ branches: Branch[] }>(management + '/dashboard', { ...session, signal })
  return response.data.branches
}

export async function getPublicBranches(signal?: AbortSignal) {
  const response = await apiClient.get<{ branches: Branch[] }>('/api/v1/branches', { signal })
  return response.data.branches
}

export async function getBranch(id: BranchId, signal: AbortSignal) {
  const response = await apiClient.get<Branch>(management + '/branches/' + id, { ...session, signal })
  return response.data
}

export async function updateBranch(id: BranchId, settings: BranchSettings) {
  const response = await apiClient.patch<Branch>(management + '/branches/' + id, settings, session)
  return response.data
}

export async function getAdmins(signal: AbortSignal) {
  const response = await apiClient.get<SessionUser[]>(management + '/admins', { ...session, signal })
  return response.data
}

export async function createAdmin(input: Registration & { branchId: BranchId }) {
  const response = await apiClient.post<SessionUser>(management + '/admins', input, session)
  return response.data
}

export async function updateAdmin(id: string, changes: { branchId?: BranchId; active?: boolean }) {
  const response = await apiClient.patch<SessionUser>(management + '/admins/' + encodeURIComponent(id), changes, session)
  return response.data
}
