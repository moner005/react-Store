export type Role = 'owner' | 'admin' | 'user'
export type BranchId = 'damascus' | 'latakia'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  branchId: BranchId | null
  active: boolean
}
