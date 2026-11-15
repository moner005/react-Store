import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBranch, hasStatus, updateBranch, type BranchSettings } from '@/services/api/accounts'
import type { BranchId } from '@/types/auth'
import { useAuthStore } from '@/stores/authStore'
import './Management.css'

const validBranches: BranchId[] = ['damascus', 'latakia']

export function BranchManagementPage() {
  const { branchId: rawBranchId } = useParams()
  const branchId = validBranches.includes(rawBranchId as BranchId) ? rawBranchId as BranchId : null
  const user = useAuthStore((state) => state.user)
  if (user?.role === 'admin' && user.branchId !== branchId) {
    return <section className="management-page">
      <h1>Manage branch</h1>
      <p role="alert">Your account cannot edit this branch.</p>
      <Link to={'/management/branches/' + user.branchId}>Open your branch</Link>
    </section>
  }
  if (!branchId) {
    return <section className="management-page">
      <h1>Manage branches</h1>
      <nav className="management-links" aria-label="Branch settings">
        {validBranches.map((id) => <Link key={id} to={'/management/branches/' + id}>{id === 'damascus' ? 'Damascus' : 'Latakia'}</Link>)}
      </nav>
    </section>
  }
  return <BranchSettingsForm key={branchId} branchId={branchId} />
}

function BranchSettingsForm({ branchId }: { branchId: BranchId }) {
  const owner = useAuthStore((state) => state.user?.role === 'owner')
  const [settings, setSettings] = useState<BranchSettings>({ address: '', phone: '', openingHours: '' })
  const [branchName, setBranchName] = useState('')
  const [loading, setLoading] = useState(Boolean(branchId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!branchId) return
    const controller = new AbortController()
    getBranch(branchId, controller.signal)
      .then((branch) => {
        setBranchName(branch.name)
        setSettings({ address: branch.address, phone: branch.phone, openingHours: branch.openingHours })
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(hasStatus(cause, 401) || hasStatus(cause, 403)
          ? 'Your account cannot edit this branch.'
          : 'Branch settings could not be loaded.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [branchId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!branchId) return
    setSaving(true); setError(''); setNotice('')
    try {
      const saved = await updateBranch(branchId, settings)
      setSettings({ address: saved.address, phone: saved.phone, openingHours: saved.openingHours })
      setNotice('Branch settings saved.')
    } catch (cause) {
      setError(hasStatus(cause, 401) || hasStatus(cause, 403)
        ? 'Your account cannot edit this branch.'
        : 'Branch settings could not be saved. Please try again.')
    } finally { setSaving(false) }
  }

  return <section className="management-page">
    <header><p className="management-eyebrow">BRANCH SETTINGS</p><h1>{branchName || 'Manage branch'}</h1>
      <p>Update contact information shown for this branch.</p></header>
    {loading ? <p role="status">Loading branch settings…</p> : !branchName ? <p role="alert">{error}</p> : <form className="management-form" onSubmit={handleSubmit}>
      {(['address', 'phone', 'openingHours'] as const).map((field) => <label key={field}>
        <span>{field === 'openingHours' ? 'Opening hours' : field[0].toUpperCase() + field.slice(1)}</span>
        <input maxLength={field === 'phone' ? 40 : field === 'openingHours' ? 160 : 240} value={settings[field]} onChange={(event) => setSettings({ ...settings, [field]: event.target.value })} />
      </label>)}
      {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
      <button type="submit" disabled={saving || !branchId}>{saving ? 'Saving…' : 'Save settings'}</button>
    </form>}
    {owner && <Link to="/dashboard">Back to owner overview</Link>}
  </section>
}
