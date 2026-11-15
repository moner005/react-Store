export type AccountRole = 'owner' | 'admin' | 'user'
export type BranchId = 'damascus' | 'latakia'

export interface PublicAccount {
  id: string
  name: string
  email: string
  role: AccountRole
  branchId: BranchId | null
  active: boolean
}

export interface Credentials {
  name: string
  email: string
  password: string
}

export type RegisterCustomerInput = Credentials

export interface LoginCredentials {
  email: string
  password: string
}

export interface CreateAdminInput extends Credentials {
  branchId: BranchId
}

export interface UpdateAdminInput {
  branchId?: BranchId
  active?: boolean
}

export interface AuthSession {
  token: string
  account: PublicAccount
}
