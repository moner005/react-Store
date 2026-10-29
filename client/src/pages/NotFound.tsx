import { Link } from 'react-router-dom'
export default function NotFoundPage() { return <section className="panel not-found"><p className="eyebrow">404 · Route not found</p><h1>That page isn’t here.</h1><p>Check the address or return to the project overview.</p><Link className="button primary" to="/">Go to overview</Link></section> }
