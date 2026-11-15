import { useRef, useState, type FormEvent } from 'react'
import './contact.css'

type Fields = { name: string; email: string; subject: string; message: string }
type FieldName = keyof Fields

const empty: Fields = { name: '', email: '', subject: '', message: '' }
const fieldNames: FieldName[] = ['name', 'email', 'subject', 'message']
const labels: Record<FieldName, string> = { name: 'Name', email: 'Email', subject: 'Subject', message: 'Message' }
const contactEmail = 'rolex.syria@gmail.com'
const emailLink = 'mailto:' + contactEmail

const channels = [
  {
    label: 'Instagram', href: 'https://www.instagram.com/rolex/',
    icon: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r=".8" fill="currentColor" stroke="none" /></>,
  },
  {
    label: 'Facebook', href: 'https://www.facebook.com/rolex',
    icon: <path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4C17.3 1.2 16.3 1 15 1c-3.2 0-5 1.9-5 5.3V9H7v4h3v8z" />,
  },
  {
    label: 'X', href: 'https://x.com/ROLEX',
    icon: <path d="M4 3h4.7l4.2 5.7L18 3h2l-6.2 7 6.7 9H16l-4.6-6.2L5.7 19H3.6l6.9-7.8zm1.5 1.5L16.8 17.5h1.3L6.8 4.5z" />,
  },
]

export default function ContactPage() {
  const [fields, setFields] = useState<Fields>(empty)
  const [errors, setErrors] = useState<Partial<Fields>>({})
  const [emailDraft, setEmailDraft] = useState('')
  const inputs = useRef<Record<FieldName, HTMLInputElement | HTMLTextAreaElement | null>>({
    name: null, email: null, subject: null, message: null,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const next: Partial<Fields> = {}
    if (!fields.name.trim()) next.name = 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) next.email = 'Enter a valid email address.'
    if (!fields.subject.trim()) next.subject = 'Enter a subject.'
    if (!fields.message.trim()) next.message = 'Enter a message.'
    setErrors(next)
    if (Object.keys(next).length) {
      setEmailDraft('')
      const firstInvalid = fieldNames.find((field) => next[field])
      if (firstInvalid) inputs.current[firstInvalid]?.focus()
      return
    }
    const body = `${fields.message.trim()}\r\n\r\n${fields.name.trim()}\r\n${fields.email.trim()}`
    setEmailDraft(`${emailLink}?subject=${encodeURIComponent(fields.subject.trim())}&body=${encodeURIComponent(body)}`)
  }

  function update(field: FieldName, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
    setEmailDraft('')
  }

  return (
    <div className="contact-page">
      <section className="contact-heading">
        <p className="eyebrow">We’re here to help</p>
        <h1>Contact</h1>
        <p>Questions, comments, or simply a note? We’d be glad to hear from you.</p>
      </section>
      <div className="contact-grid">
        <section className="contact-form-panel">
          <h2>Contact the store</h2>
          <a className="contact-email" href={emailLink}>{contactEmail}</a>
          <form onSubmit={submit} noValidate>
            {fieldNames.map((field) => {
              const isMessage = field === 'message'
              const errorId = `${field}-error`
              const common = {
                id: field,
                name: field,
                required: true,
                value: fields[field],
                'aria-invalid': Boolean(errors[field]),
                'aria-describedby': errors[field] ? errorId : undefined,
                onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field, event.currentTarget.value),
                ref: (element: HTMLInputElement | HTMLTextAreaElement | null) => { inputs.current[field] = element },
              }
              return (
                <div className="contact-field" key={field}>
                  <label htmlFor={field}>{labels[field]}</label>
                  {isMessage
                    ? <textarea {...common} rows={5} />
                    : <input {...common} type={field === 'email' ? 'email' : 'text'} autoComplete={field === 'name' ? 'name' : field === 'email' ? 'email' : 'off'} />}
                  {errors[field] && <span className="field-error" id={errorId}>{errors[field]}</span>}
                </div>
              )
            })}
            <button className="contact-submit" type="submit">Prepare email</button>
            <div aria-live="polite">
              {emailDraft && <a className="contact-result" href={emailDraft}>Open email draft</a>}
            </div>
          </form>
        </section>
        <aside className="official-panel">
          <h2>External links</h2>
          <a className="official-link" href="https://www.rolex.com/" target="_blank" rel="noreferrer">Manufacturer website ↗</a>
          <a className="official-link" href="https://www.rolex.com/store-locator" target="_blank" rel="noreferrer">Find a boutique ↗</a>
          <div className="contact-socials" aria-label="External social media">
            {channels.map((channel) => (
              <a key={channel.label} href={channel.href} aria-label={channel.label + ' (external)'} title={channel.label} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {channel.icon}
                </svg>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
