import { Link } from 'react-router-dom'

interface ScaffoldPageProps { title: string; taskIds: string; summary: string }

export function ScaffoldPage({ title, taskIds, summary }: ScaffoldPageProps) {
  return <section className="panel scaffold-panel"><p className="eyebrow">Planned feature · {taskIds}</p><h1>{title}</h1><p>{summary}</p><div className="notice"><strong>Not implemented yet.</strong> This route is a structural placeholder; no store data or mutations are connected.</div><Link className="text-link" to="/">Return to project overview →</Link></section>
}
