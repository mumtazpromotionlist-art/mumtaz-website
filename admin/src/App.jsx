import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const emptyForm = {
  id: null,
  title: '',
  description: '',
  isActive: true,
  startAt: '',
  endAt: '',
  thumbnailPath: '',
  pdfPath: ''
}

function toLocalInputValue(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (v) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIsoOrNull(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('cms_token') || '')
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [login, setLogin] = useState({ username: '', password: '' })

  const authHeaders = useMemo(() => (
    token ? { Authorization: `Bearer ${token}` } : {}
  ), [token])

  useEffect(() => {
    if (token) {
      loadOffers()
    }
  }, [token])

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {})
      }
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Request failed')
    }

    return response.json()
  }

  async function loadOffers() {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/admin/offers')
      setOffers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login)
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Login failed')
      }

      const data = await response.json()
      localStorage.setItem('cms_token', data.token)
      setToken(data.token)
    } catch (err) {
      setError(err.message)
    }
  }

  function resetForm() {
    setForm(emptyForm)
  }

  function startEdit(offer) {
    setForm({
      id: offer.id,
      title: offer.title || '',
      description: offer.description || '',
      isActive: offer.is_active === 1,
      startAt: toLocalInputValue(offer.start_at),
      endAt: toLocalInputValue(offer.end_at),
      thumbnailPath: offer.thumbnail_path || '',
      pdfPath: offer.pdf_path || ''
    })
  }

  async function saveOffer(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
      startAt: toIsoOrNull(form.startAt),
      endAt: toIsoOrNull(form.endAt),
      thumbnailPath: form.thumbnailPath || null,
      pdfPath: form.pdfPath || null
    }

    try {
      if (!payload.title) {
        throw new Error('Title is required')
      }

      if (form.id) {
        await apiFetch(`/admin/offers/${form.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
        setSuccess('Offer updated')
      } else {
        await apiFetch('/admin/offers', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        setSuccess('Offer created')
      }

      resetForm()
      loadOffers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteOffer(id) {
    if (!window.confirm('Delete this offer?')) return
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/admin/offers/${id}`, { method: 'DELETE' })
      setSuccess('Offer deleted')
      loadOffers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleActive(offer) {
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/admin/offers/${offer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: offer.is_active !== 1 })
      })
      loadOffers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function uploadFile(file, type) {
    if (!file) return

    const body = new FormData()
    body.append('file', file)

    const response = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: { ...authHeaders },
      body
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Upload failed')
    }

    const data = await response.json()

    if (type === 'thumbnail') {
      setForm((prev) => ({ ...prev, thumbnailPath: data.path }))
    } else {
      setForm((prev) => ({ ...prev, pdfPath: data.path }))
    }
  }

  function handleLogout() {
    localStorage.removeItem('cms_token')
    setToken('')
    setOffers([])
    resetForm()
  }

  if (!token) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <h1>Offer CMS</h1>
          <p>Sign in to manage offers</p>
          <form onSubmit={handleLogin}>
            <label>
              Username
              <input
                type="text"
                value={login.username}
                onChange={(e) => setLogin((prev) => ({ ...prev, username: e.target.value }))}
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={login.password}
                onChange={(e) => setLogin((prev) => ({ ...prev, password: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit">Login</button>
            {error && <div className="alert error">{error}</div>}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Offer CMS</h1>
          <p>Manage your live offers and schedules</p>
        </div>
        <div className="header-actions">
          <span className="status-pill">API: {API_BASE}</span>
          <button className="ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-body">
        <section className="panel list-panel">
          <div className="panel-header">
            <h2>Offers</h2>
            <button className="ghost" onClick={loadOffers}>Refresh</button>
          </div>
          {loading && <div className="muted">Loading…</div>}
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}
          <div className="offer-list">
            {offers.map((offer) => (
              <div className="offer-card" key={offer.id}>
                <div className="offer-meta">
                  <div>
                    <h3>{offer.title}</h3>
                    <p>{offer.description}</p>
                  </div>
                  <span className={offer.is_active === 1 ? 'tag active' : 'tag inactive'}>
                    {offer.is_active === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="offer-times">
                  <span>Start: {offer.start_at ? new Date(offer.start_at).toLocaleString() : 'Now'}</span>
                  <span>End: {offer.end_at ? new Date(offer.end_at).toLocaleString() : 'Open'}</span>
                </div>
                <div className="offer-actions">
                  <button onClick={() => startEdit(offer)}>Edit</button>
                  <button onClick={() => toggleActive(offer)} className="ghost">
                    {offer.is_active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteOffer(offer.id)} className="danger">Delete</button>
                </div>
                <div className="offer-files">
                  {offer.thumbnail_path && (
                    <img src={`${API_BASE}${offer.thumbnail_path}`} alt="Thumbnail" />
                  )}
                  {offer.pdf_path && (
                    <a href={`${API_BASE}${offer.pdf_path}`} target="_blank" rel="noreferrer">
                      View PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
            {!offers.length && !loading && <div className="muted">No offers yet.</div>}
          </div>
        </section>

        <section className="panel form-panel">
          <div className="panel-header">
            <h2>{form.id ? 'Edit Offer' : 'Create Offer'}</h2>
            {form.id && <button className="ghost" onClick={resetForm}>New Offer</button>}
          </div>
          <form onSubmit={saveOffer} className="offer-form">
            <label>
              Title
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows="4"
              />
            </label>
            <label className="inline">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active now
            </label>
            <div className="split">
              <label>
                Start
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startAt: e.target.value }))}
                />
              </label>
              <label>
                End
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, endAt: e.target.value }))}
                />
              </label>
            </div>
            <div className="split">
              <label>
                Thumbnail
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadFile(e.target.files?.[0], 'thumbnail').catch((err) => setError(err.message))}
                />
                {form.thumbnailPath && <span className="muted">{form.thumbnailPath}</span>}
              </label>
              <label>
                Offer PDF
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => uploadFile(e.target.files?.[0], 'pdf').catch((err) => setError(err.message))}
                />
                {form.pdfPath && <span className="muted">{form.pdfPath}</span>}
              </label>
            </div>
            <button type="submit" className="primary">{form.id ? 'Save Changes' : 'Create Offer'}</button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default App
