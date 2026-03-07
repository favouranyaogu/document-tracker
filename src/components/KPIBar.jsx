import { useMemo, useState } from 'react'

export default function KPIBar({ documents, formatAmount, isDocOverdue, isDueSoon }) {
  const [range, setRange] = useState('month')

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const currentMonthLabel = now.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric'
  })

  const scopedDocuments = useMemo(() => {
    if (range === 'all') return documents

    return documents.filter((doc) => {
      if (!doc.created_at) return false
      const createdAt = new Date(doc.created_at)
      return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear
    })
  }, [documents, range, currentMonth, currentYear])

  const totalDocuments = scopedDocuments.length
  const totalAmount = scopedDocuments.reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0)
  const overdueCount = scopedDocuments.filter(isDocOverdue).length
  const dueSoonCount = scopedDocuments.filter(isDueSoon).length
  const sentCount = scopedDocuments.filter((doc) => doc.status === 'completed').length

  return (
    <section className="kpi-section" aria-label="Document Summary">
      <div className="kpi-header">
        <div>
          <p className="kpi-month-label">{currentMonthLabel}</p>
          <h1 className="kpi-page-title">Dashboard</h1>
        </div>
        <div className="kpi-range-toggle" role="group" aria-label="KPI range">
          <button
            type="button"
            className={`kpi-range-btn ${range === 'month' ? 'kpi-range-btn-active' : ''}`}
            onClick={() => setRange('month')}
          >
            This Month
          </button>
          <button
            type="button"
            className={`kpi-range-btn ${range === 'all' ? 'kpi-range-btn-active' : ''}`}
            onClick={() => setRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="kpi-bar">
        <article className="kpi-card">
          <p className="kpi-label">Total Documents</p>
          <p className="kpi-value">{totalDocuments}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Total Amount</p>
          <p className="kpi-value">{formatAmount(totalAmount)}</p>
        </article>
        <article className="kpi-card kpi-card-overdue">
          <p className="kpi-label">Overdue</p>
          <p className="kpi-value kpi-value-overdue">{overdueCount}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Due Soon</p>
          <p className="kpi-value">{dueSoonCount}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Total Sent</p>
          <p className="kpi-value">{sentCount}</p>
        </article>
      </div>
    </section>
  )
}
