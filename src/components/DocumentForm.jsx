export default function DocumentForm({
  beneficiary,
  setBeneficiary,
  reference,
  setReference,
  batchNumber,
  setBatchNumber,
  description,
  setDescription,
  amount,
  setAmount,
  status,
  setStatus,
  manualDocumentType,
  setManualDocumentType,
  detectedDocumentType,
  docError,
  submitLoading,
  onSubmit,
  formatDocumentType
}) {
  return (
    <section className="panel create-panel">
      <div className="panel-heading">
        <h2>Create Document</h2>
        <p>Add new records with an initial workflow status.</p>
      </div>
      <form className="create-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="beneficiary">Beneficiary</label>
          <input
            id="beneficiary"
            type="text"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reference">Reference Number / Payment Voucher Number</label>
          <input
            id="reference"
            type="text"
            placeholder="e.g. DOC-2026-001"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="batch-number">Batch Number</label>
          <input
            id="batch-number"
            type="text"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            required
          />
          {detectedDocumentType ? (
            <p className="detected-type-label">Detected: {formatDocumentType(detectedDocumentType)}</p>
          ) : (
            <div className="manual-type-select-wrap">
              <label htmlFor="manual-document-type">Select type</label>
              <select
                id="manual-document-type"
                value={manualDocumentType}
                onChange={(e) => setManualDocumentType(e.target.value)}
              >
                <option value="">Select type</option>
                <option value="third_party">Third Party</option>
                <option value="claims">Claims</option>
              </select>
            </div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
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
  )
}
