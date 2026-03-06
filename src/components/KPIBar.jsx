export default function KPIBar({ totalDocuments, totalAmount, overdueCount, dueSoonCount, sentCount, formatAmount }) {
  return (
    <section className="kpi-bar" aria-label="Document Summary">
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
    </section>
  )
}
