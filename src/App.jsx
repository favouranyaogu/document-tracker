import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [documents, setDocuments] = useState([])
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [status, setStatus] = useState('pending')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('pending')
  const [editDueDate, setEditDueDate] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [historyExpandedId, setHistoryExpandedId] = useState(null)
  const [activityLogs, setActivityLogs] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchDocuments() {
    if (!user) return
    setDocLoading(true)
    setDocError(null)
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, description, reference, status, due_date, status_updated_at, created_at')
      .order('created_at', { ascending: false })
    setDocLoading(false)
    if (error) {
      setDocError(error.message)
      return
    }
    setDocuments(data || [])
  }

  async function updateDocumentDetails(id) {
    setDocError(null)
    const { error } = await supabase
      .from('documents')
      .update({
        title: editTitle,
        description: editDescription || null
      })
      .eq('id', id)

    if (error) {
      setDocError(error.message)
      return false
    }

    await supabase.from('activity_logs').insert({
      document_id: id,
      action: 'edited',
      user_id: user.id
    })

    setEditingId(null)
    setEditStatus('pending')
    setEditDueDate('')
    fetchDocuments()
    if (historyExpandedId === id) fetchActivityLogs(id)
    return true
  }

  async function handleInlineEditSave(doc) {
    const detailsSaved = await updateDocumentDetails(doc.id)
    if (!detailsSaved) return
    if (editStatus !== doc.status) {
      await updateDocumentStatus(doc.id, editStatus, doc.status)
    }
  }

  function toDateInputValue(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''
    const tzOffset = date.getTimezoneOffset() * 60 * 1000
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10)
  }

  function startEdit(doc) {
    setEditingId(doc.id)
    setEditTitle(doc.title || '')
    setEditDescription(doc.description || '')
    setEditStatus(doc.status || 'pending')
    setEditDueDate(toDateInputValue(doc.due_date))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditStatus('pending')
    setEditDueDate('')
  }

  async function fetchActivityLogs(documentId) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, old_value, new_value, user_id, created_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
    if (error) return
    setActivityLogs(data || [])
  }

  function toggleHistory(docId) {
    if (historyExpandedId === docId) {
      setHistoryExpandedId(null)
      setActivityLogs([])
    } else {
      setHistoryExpandedId(docId)
      fetchActivityLogs(docId)
    }
  }

  async function updateDocumentStatus(id, newStatus, oldStatus) {
    const { error } = await supabase
      .from('documents')
      .update({
        status: newStatus,
        status_updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      setDocError(error.message)
      return
    }

    await supabase.from('activity_logs').insert({
      document_id: id,
      action: 'status_changed',
      old_value: oldStatus ?? null,
      new_value: newStatus,
      user_id: user.id
    })

    fetchDocuments()
    if (historyExpandedId === id) fetchActivityLogs(id)
  }

  async function createDocument() {
    const refValue = reference.trim()
    if (!refValue) {
      setDocError('Reference number is required')
      return false
    }

    const { data: newDoc, error } = await supabase
      .from('documents')
      .insert({
        reference: refValue,
        title,
        description: description || null,
        status,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user.id
      })
      .select('id')
      .single()

    if (error) {
      setDocError(error.message)
      return false
    }

    await supabase.from('activity_logs').insert({
      document_id: newDoc.id,
      action: 'created',
      user_id: user.id
    })

    fetchDocuments()
    return true
  }

  useEffect(() => {
    if (user) fetchDocuments()
  }, [user])

  async function handleSubmitDocument(e) {
    e.preventDefault()
    setDocError(null)

    if (!reference || reference.trim() === '') {
      setDocError('Reference number is required')
      return
    }

    setSubmitLoading(true)
    const success = await createDocument()
    setSubmitLoading(false)

    if (success) {
      setTitle('')
      setDescription('')
      setReference('')
      setStatus('pending')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoginLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoginLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    setEmail('')
    setPassword('')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function getDueStatus(dueDate) {
    if (!dueDate) return 'normal'
    const now = new Date()
    const due = new Date(dueDate)
    if (now > due) return 'overdue'
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'due_today'
    return 'normal'
  }

  function getDueText(dueDate) {
    if (!dueDate) return 'No due date'
    const now = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `Overdue by ${Math.abs(diff)} day(s)`
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Due tomorrow'
    return `Due in ${diff} days`
  }

  function isDocOverdue(doc) {
    if (!doc?.due_date) return false
    return new Date(doc.due_date) < new Date() && doc.status !== 'completed'
  }

  function isDueSoon(doc) {
    if (!doc?.due_date || doc.status === 'completed') return false
    const now = new Date()
    const due = new Date(doc.due_date)
    if (now > due) return false
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    return diff <= 2
  }

  function formatDueDate(value) {
    if (!value) return 'No due date'
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function getDescriptionExcerpt(value) {
    if (!value) return 'No description provided.'
    const text = value.replace(/\s+/g, ' ').trim()
    if (text.length <= 160) return text
    return `${text.slice(0, 157)}...`
  }

  function formatStatusForDisplay(value) {
    if (value === 'pending') return 'Pending'
    if (value === 'in_progress') return 'In Progress'
    if (value === 'completed') return 'Sent'
    if (value === 'overdue') return 'Overdue'
    return value
  }

  function getBadgeForDocument(doc) {
    if (isDocOverdue(doc)) return { label: 'Overdue', className: 'status-overdue' }
    if (doc.status === 'pending') return { label: 'Pending', className: 'status-pending' }
    if (doc.status === 'in_progress') return { label: 'In Progress', className: 'status-in-progress' }
    if (doc.status === 'completed') return { label: 'Sent', className: 'status-sent' }
    return { label: formatStatusForDisplay(doc.status), className: 'status-pending' }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = !search.trim() || [doc.title, doc.description, doc.reference]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))

    const matchesFilter =
      filter === 'all' ||
      (filter === 'overdue' && isDocOverdue(doc)) ||
      (filter === 'pending' && doc.status === 'pending') ||
      (filter === 'in_progress' && doc.status === 'in_progress') ||
      (filter === 'completed' && doc.status === 'completed')

    return matchesSearch && matchesFilter
  })

  const overdueCount = documents.filter(isDocOverdue).length
  const dueSoonCount = documents.filter(isDueSoon).length

  if (loading) {
    return (
      <div className="app-shell app-loading">
        <p className="loading-msg">Loading...</p>
      </div>
    )
  }

  const dashboardView = (
    <div className="app-shell">
      <header className="top-nav">
        <div className="nav-brand">
          <span className="brand-mark">DT</span>
          <div>
            <p className="brand-title">Document Tracker</p>
            <p className="brand-subtitle">SaaS Workspace</p>
          </div>
        </div>
        <div className="nav-user">
          <span className="user-email">{user?.email}</span>
          <button type="button" className="btn btn-neutral" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="kpi-bar" aria-label="Document Summary">
          <article className="kpi-card">
            <p className="kpi-label">Total Documents</p>
            <p className="kpi-value">{documents.length}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Overdue</p>
            <p className="kpi-value value-overdue">{overdueCount}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Due Soon</p>
            <p className="kpi-value">{dueSoonCount}</p>
          </article>
        </section>

        <section className="panel create-panel">
          <div className="panel-heading">
            <h2>Create Document</h2>
            <p>Add new records with an initial workflow status.</p>
          </div>
          <form className="create-form" onSubmit={handleSubmitDocument}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reference">Reference</label>
              <input
                id="reference"
                type="text"
                placeholder="e.g. DOC-2026-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Sent</option>
              </select>
            </div>
            {docError && <p className="error-msg">{docError}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? 'Adding...' : 'Add Document'}
            </button>
          </form>
        </section>

        <section className="panel documents-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Documents</h2>
              <p>Search, filter, edit, and monitor activity inline.</p>
            </div>
          </div>

          <div className="controls-row">
            <div className="control-field">
              <label htmlFor="search-documents">Search</label>
              <input
                id="search-documents"
                type="text"
                placeholder="Search by title, description, or reference"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="control-field">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Sent</option>
              </select>
            </div>
          </div>

          {docError && <p className="error-msg">{docError}</p>}

          {docLoading && <p className="loading-msg">Loading documents...</p>}
          {!docLoading && documents.length === 0 && <p className="empty-msg">No documents yet.</p>}
          {!docLoading && documents.length > 0 && filteredDocuments.length === 0 && (
            <p className="empty-msg">No documents match your search or filter.</p>
          )}

          {!docLoading && documents.length > 0 && filteredDocuments.length > 0 && (
            <div className="document-grid">
              {filteredDocuments.map((doc) => {
                const badge = getBadgeForDocument(doc)
                const dueStatus = getDueStatus(doc.due_date)
                return (
                  <article key={doc.id} className="document-card">
                    {editingId === doc.id ? (
                      <div className="edit-panel">
                        <h3 className="edit-title">Edit Document</h3>
                        <div className="form-group">
                          <label htmlFor={`edit-title-${doc.id}`}>Title</label>
                          <input
                            id={`edit-title-${doc.id}`}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-desc-${doc.id}`}>Description</label>
                          <textarea
                            id={`edit-desc-${doc.id}`}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-status-${doc.id}`}>Status</label>
                          <select
                            id={`edit-status-${doc.id}`}
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Sent</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-due-${doc.id}`}>Due Date</label>
                          <input
                            id={`edit-due-${doc.id}`}
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                          />
                        </div>
                        <div className="inline-actions">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleInlineEditSave(doc)}
                          >
                            Save
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="card-top-row">
                          <p className="document-reference">Reference: {doc.reference || 'N/A'}</p>
                          <span className={`status-pill ${badge.className}`}>{badge.label}</span>
                        </div>
                        <h3 className="document-title">{doc.title}</h3>
                        <p className={`document-due ${dueStatus === 'overdue' ? 'due-overdue' : ''}`}>
                          Due Date: {formatDueDate(doc.due_date)} ({getDueText(doc.due_date)})
                        </p>
                        <p className="document-description">{getDescriptionExcerpt(doc.description)}</p>

                        <div className="status-control">
                          <label htmlFor={`status-${doc.id}`}>Status</label>
                          <select
                            id={`status-${doc.id}`}
                            value={doc.status}
                            onChange={(e) => updateDocumentStatus(doc.id, e.target.value, doc.status)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Sent</option>
                          </select>
                        </div>

                        <div className="card-actions">
                          <button type="button" className="btn btn-primary btn-small" onClick={() => startEdit(doc)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`btn btn-neutral btn-small ${historyExpandedId === doc.id ? 'btn-active' : ''}`}
                            onClick={() => toggleHistory(doc.id)}
                          >
                            {historyExpandedId === doc.id ? 'Hide History' : 'View History'}
                          </button>
                        </div>

                        {historyExpandedId === doc.id && (
                          <div className="activity-history">
                            {activityLogs.length === 0 && <p className="empty-msg">No activity yet.</p>}
                            {activityLogs.length > 0 && (
                              <ul className="activity-list">
                                {activityLogs.map((log) => (
                                  <li key={log.id} className="activity-item">
                                    <span className="activity-action">{log.action}</span>
                                    {log.old_value != null && (
                                      <span className="activity-detail">
                                        {' '}
                                        {formatStatusForDisplay(log.old_value)} {'->'} {formatStatusForDisplay(log.new_value)}
                                      </span>
                                    )}
                                    <span className="activity-meta">
                                      {' '}
                                      ({log.user_id === user.id ? 'You' : `${log.user_id.slice(0, 8)}...`}){' '}
                                      {new Date(log.created_at).toLocaleString()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )

  const loginView = (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Document Tracker</h1>
        <p className="auth-subtitle">Sign in to continue.</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary full-width" disabled={loginLoading}>
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : loginView} />
      <Route path="/" element={user ? dashboardView : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
