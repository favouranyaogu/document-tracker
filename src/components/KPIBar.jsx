import { useMemo, useState } from 'react'

export default function KPIBar({ documents, formatAmount, isDocOverdue, isDueSoon, compactAmounts = false }) {
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
  const fullTotalAmount = formatAmount(totalAmount)

  function formatCompactCurrency(value) {
    const number = Number(value)
    if (Number.isNaN(number)) {
      return {
        prefix: 'NGN',
        amount: '0.00'
      }
    }

    const absValue = Math.abs(number)
    const units = [
      { value: 1000000000, suffix: 'B' },
      { value: 1000000, suffix: 'M' },
      { value: 1000, suffix: 'K' }
    ]
    const matchedUnit = units.find((unit) => absValue >= unit.value)

    if (!matchedUnit) {
      return {
        prefix: 'NGN',
        amount: number.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      }
    }

    const compactValue = number / matchedUnit.value
    const decimals = Math.abs(compactValue) >= 100 ? 0 : 1

    return {
      prefix: 'NGN',
      amount: `${compactValue.toFixed(decimals).replace(/\.0$/, '')}${matchedUnit.suffix}`
    }
  }

  const compactTotalAmount = formatCompactCurrency(totalAmount)

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
          <p
            className={`kpi-value kpi-value-currency-lockup ${compactAmounts ? 'kpi-value-currency-lockup-compact' : ''}`}
            title={fullTotalAmount}
          >
            <span className="kpi-value-prefix">{compactTotalAmount.prefix}</span>
            <span className="kpi-value-amount">{compactTotalAmount.amount}</span>
          </p>
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
