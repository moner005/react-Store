import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'

export default function LoginPage() {
  return (
    <section className="auth-preview">
      <p className="eyebrow">Account access preview</p>
      <h1>Login</h1>
      <p>Login is planned for a later project phase. This page does not create a session or collect account details.</p>
      <p className="auth-preview-notice" role="note">Authentication is not available yet.</p>
      <nav aria-label="Account preview navigation">
        <Link to={routes.register}>Register preview</Link>
        <Link to={routes.home}>Return to the store</Link>
      </nav>
    </section>
  )
}
