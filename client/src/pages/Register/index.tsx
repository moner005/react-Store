import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'

export default function RegisterPage() {
  return (
    <section className="auth-preview">
      <p className="eyebrow">Account access preview</p>
      <h1>Register</h1>
      <p>Registration is planned for a later project phase. This page does not create an account or collect personal details.</p>
      <p className="auth-preview-notice" role="note">Account creation is not available yet.</p>
      <nav aria-label="Account preview navigation">
        <Link to={routes.login}>Login preview</Link>
        <Link to={routes.home}>Return to the store</Link>
      </nav>
    </section>
  )
}
