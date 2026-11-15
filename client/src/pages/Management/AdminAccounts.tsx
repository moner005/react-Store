import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createAdmin, getAdmins, hasStatus, updateAdmin } from '@/services/api/accounts'
import type { BranchId, SessionUser } from '@/types/auth'
import './Management.css'

export function AdminAccountsPage() {
  const [admins, setAdmins] = useState<SessionUser[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [branchId, setBranchId] = useState<BranchId>('damascus')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async (signal: AbortSignal) => {
    try { setAdmins(await getAdmins(signal)) }
    catch (cause) {
      if (!signal.aborted) setError(hasStatus(cause, 401) || hasStatus(cause, 403)
        ? 'Your account cannot manage administrators.'
        : 'Administrator accounts could not be loaded.')
    } finally { if (!signal.aborted) setLoading(false) }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => refresh(controller.signal))
    return () => controller.abort()
  }, [refresh])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      await createAdmin({ name, email, password, branchId })
      setName(''); setEmail(''); setPassword('')
      const controller = new AbortController()
      await refresh(controller.signal)
      setNotice('Administrator account created.')
    } catch (cause) {
      setError(hasStatus(cause, 401) || hasStatus(cause, 403)
        ? 'Your account cannot manage administrators.'
        : 'Administrator account could not be created.')
    } finally { setSaving(false) }
  }

  async function changeAdmin(id: string, changes: { branchId?: BranchId; active?: boolean }) {
    setError(''); setNotice('')
    try {
      const updated = await updateAdmin(id, changes)
      setAdmins((current) => current.map((admin) => admin.id === id ? updated : admin))
      setNotice('Administrator account updated.')
    } catch (cause) {
      setError(hasStatus(cause, 401) || hasStatus(cause, 403)
        ? 'Your account cannot manage administrators.'
        : 'Administrator account could not be updated.')
    }
  }

  return <section className="management-page">
    <header><p className="management-eyebrow">OWNER</p><h1>Administrator accounts</h1>
      <p>Create staff access and assign each administrator to a branch.</p></header>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <form className="management-form" onSubmit={handleCreate}>
      <h2>Add administrator</h2>
      <label><span>Name</span><input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label><span>Email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label><span>Temporary password</span><input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <label><span>Branch</span><BranchSelect value={branchId} onChange={setBranchId} /></label>
      <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create administrator'}</button>
    </form>
    <h2>Current administrators</h2>
    {loading ? <p role="status">Loading administrators…</p> : admins.length === 0 ? <p>No administrator accounts yet.</p> :
      <div className="management-cards">{admins.map((admin) => <article className="management-card" key={admin.id}>
        <h3>{admin.name}</h3><p>{admin.email}</p>
        <label>Branch <BranchSelect value={admin.branchId ?? 'damascus'} onChange={(value) => void changeAdmin(admin.id, { branchId: value })} /></label>
        <button type="button" onClick={() => void changeAdmin(admin.id, { active: !admin.active })}>
          {admin.active ? 'Disable account' : 'Enable account'}
        </button><span>{admin.active ? 'Active' : 'Disabled'}</span>
      </article>)}</div>}
  </section>
}

function BranchSelect({ value, onChange }: { value: BranchId; onChange(value: BranchId): void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value as BranchId)}>
    <option value="damascus">Damascus</option><option value="latakia">Latakia</option>
  </select>
}
