import { Link } from 'react-router-dom'

interface ScaffoldPageProps { title: string; summary: string }

export function ScaffoldPage({ title, summary }: ScaffoldPageProps) {
  return <section className="panel scaffold-panel"><h1>{title}</h1><p>{summary}</p><Link className="text-link" to="/">Back to home →</Link></section>
}
