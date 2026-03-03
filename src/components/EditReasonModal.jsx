function EditReasonModal({ document, editReason, onReasonChange, onContinue, onCancel }) {
  if (!document) return null

  return (
    <div className="modal-overlay">
      <div className="edit-reason-modal" role="dialog" aria-modal="true" aria-labelledby="edit-reason-title">
        <h3 id="edit-reason-title" className="edit-reason-title">Reason for Edit</h3>
        <div className="form-group">
          <label htmlFor="edit-reason-textarea">Please provide a reason for editing this document.</label>
          <textarea
            id="edit-reason-textarea"
            value={editReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            required
            autoFocus
          />
        </div>
        <div className="edit-reason-actions">
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            Continue
          </button>
          <button type="button" className="btn btn-neutral" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditReasonModal
