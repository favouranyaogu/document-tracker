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
  const [status, setStatus] = useState('pending');
  const [submitLoading, setSubmitLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
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
      return
    }
    await supabase.from('activity_logs').insert({
      document_id: id,
      action: 'edited',
      user_id: user.id
    })
    setEditingId(null)
    fetchDocuments()
    if (historyExpandedId === id) fetchActivityLogs(id)
  }

  function startEdit(doc) {
    setEditingId(doc.id)
    setEditTitle(doc.title || '')
    setEditDescription(doc.description || '')
  }

  function cancelEdit() {
    setEditingId(null)
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
    console.log('updateDocumentStatus called', { id, newStatus })
    const { error } = await supabase
      .from('documents')
      .update({
        status: newStatus,
        status_updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('updateDocumentStatus failed', error)
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
    console.log('updateDocumentStatus success', { id, newStatus })
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
  
    const success = await createDocument()
    if (success) {
      setTitle('')
      setDescription('')
      setReference('')
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
    const now = new Date()
    const due = new Date(dueDate)
    if (now > due) return 'overdue'
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'due_today'
    return 'normal'
  }

  function getDueText(dueDate) {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `Overdue by ${Math.abs(diff)} day(s)`
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Due tomorrow'
    return `Due in ${diff} days`
  }

  function isToday(dateString) {
    if (!dateString) return false
    const today = new Date()
    const d = new Date(dateString)
    return d.toDateString() === today.toDateString()
  }

  function isDocOverdue(doc) {
    return new Date(doc.due_date) < new Date() && doc.status !== 'completed'
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = !search.trim() || [doc.title, doc.description, doc.reference]
      .filter(Boolean)
      .some((val) => val.toLowerCase().includes(search.trim().toLowerCase()))
    const matchesFilter =
      filter === 'all' ||
      (filter === 'overdue' && isDocOverdue(doc)) ||
      (filter === 'pending' && doc.status === 'pending') ||
      (filter === 'in_progress' && doc.status === 'in_progress') ||
      (filter === 'completed' && doc.status === 'completed')
    return matchesSearch && matchesFilter
  })

  const overdueCount = documents.filter(isDocOverdue).length
  const inProgressCount = documents.filter((d) => d.status === 'in_progress').length
  const completedTodayCount = documents.filter(
    (d) => d.status === 'completed' && isToday(d.status_updated_at)
  ).length

  function formatStatusForDisplay(value) {
    if (value === 'pending') return 'Pending'
    if (value === 'in_progress') return 'In Progress'
    if (value === 'completed') return 'Completed'
    return value
  }

  if (loading) {
    return (
      <div className="app-wrap">
        <p className="loading-msg">Loading...</p>
      </div>
    )
  }

  const dashboardView = (
    <div className="app-wrap">
      <header className="header-bar">
        <h1>Welcome, {user?.email}</h1>
        <button type="button" onClick={handleLogout}>Sign out</button>
      </header>

        <div className="card">
          <h2 className="card-title">Create document</h2>
          <form onSubmit={handleSubmitDocument}>
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
                <option value="completed">Completed</option>
              </select>
            </div>
            {docError && <p className="error-msg">{docError}</p>}
            <button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Adding...' : 'Add document'}
            </button>
          </form>
        </div>

        <h2 className="section-title">Documents</h2>

        <div className="summary-cards">
          <div className="summary-card">
            <span className="summary-label">Total Documents</span>
            <span className="summary-value">{documents.length}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Overdue</span>
            <span className="summary-value summary-overdue">{overdueCount}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">In Progress</span>
            <span className="summary-value">{inProgressCount}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Completed Today</span>
            <span className="summary-value">{completedTodayCount}</span>
          </div>
        </div>

        <div className="form-group search-form-group">
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          {['all', 'overdue', 'pending', 'in_progress', 'completed'].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-btn ${filter === f ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'overdue' ? 'Overdue' : f === 'pending' ? 'Pending' : f === 'in_progress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        {docLoading && <p className="loading-msg">Loading documents...</p>}
        {!docLoading && documents.length === 0 && <p className="empty-msg">No documents yet.</p>}
        {!docLoading && documents.length > 0 && filteredDocuments.length === 0 && (
          <p className="empty-msg">No documents match your search or filter.</p>
        )}
        {!docLoading && documents.length > 0 && filteredDocuments.length > 0 && (
          <ul className="doc-list">
            {filteredDocuments.map((doc) => (
              <li key={doc.id} className="doc-item">
                {editingId === doc.id ? (
                  <>
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
                    <div className="doc-edit-actions">
                      <button type="button" onClick={() => updateDocumentDetails(doc.id)}>Save</button>
                      <button type="button" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="doc-item-title">{doc.title}</p>
                    {doc.description && <p className="doc-item-desc">{doc.description}</p>}
                    <div className="doc-item-meta">
                      <div className="doc-meta-row">
                        <select
                          className="doc-status-select"
                          value={doc.status}
                          onChange={(e) => updateDocumentStatus(doc.id, e.target.value, doc.status)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <span className="doc-created">{new Date(doc.created_at).toLocaleString()}</span>
                        <span
                          className={`due-label ${
                            getDueStatus(doc.due_date) === 'overdue'
                              ? 'overdue-label'
                              : getDueStatus(doc.due_date) === 'due_today'
                              ? 'due-today-label'
                              : ''
                          }`}
                        >
                          {getDueText(doc.due_date)}
                        </span>
                      </div>
                      <div className="doc-actions">
                        <button type="button" onClick={() => startEdit(doc)} className="doc-edit-btn">Edit</button>
                        <button
                          type="button"
                          className={`doc-edit-btn ${historyExpandedId === doc.id ? 'history-active' : ''}`}
                          onClick={() => toggleHistory(doc.id)}
                        >
                          {historyExpandedId === doc.id ? 'Hide History' : 'View History'}
                        </button>
                      </div>
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
                                  <span className="activity-detail"> {log.old_value} → {log.new_value}</span>
                                )}
                                <span className="activity-meta">
                                  {' '}({log.user_id === user.id ? 'You' : log.user_id.slice(0, 8) + '…'}){' '}
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
              </li>
            ))}
          </ul>
        )}
    </div>
  )

  const loginView = (
    <div className="app-wrap">
      <h1>Document Tracker — Login</h1>
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
        <button type="submit" disabled={loginLoading}>
          {loginLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
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
