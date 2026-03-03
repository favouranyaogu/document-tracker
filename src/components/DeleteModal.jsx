function DeleteModal({ document, onConfirm, onCancel }) {
  if (!document) return null

  return (
    <div className="modal-overlay">
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-message">
        <p id="delete-confirm-message" className="confirm-modal-message">
          Are you sure you want to delete this document? This action cannot be undone.
        </p>
        <p className="confirm-modal-detail">
          Beneficiary: <strong>{document.beneficiary || 'N/A'}</strong>
        </p>
        <p className="confirm-modal-detail">
          Reference Number / Payment Voucher Number: <strong>{document.reference || 'N/A'}</strong>
        </p>
        <div className="confirm-modal-actions">
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
          <button type="button" className="btn btn-neutral" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
