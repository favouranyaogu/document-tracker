export default function DocumentCard({
  doc,
  userRole,
  currentUserId,
  editingId,
  editBeneficiary,
  setEditBeneficiary,
  editReference,
  setEditReference,
  editBatchNumber,
  setEditBatchNumber,
  editDescription,
  setEditDescription,
  editAmount,
  setEditAmount,
  editStatus,
  setEditStatus,
  editDueDate,
  setEditDueDate,
  historyExpandedId,
  activityLogs,
  activityLogUsers,
  editCounts,
  editedCounts,
  permissionMessages,
  onEditClick,
  onDeleteClick,
  onToggleHistory,
  onStatusChange,
  onInlineEditSave,
  onCancelEdit,
  getBadgeForDocument,
  getDueStatus,
  getDueText,
  formatDueDate,
  formatAmount,
  formatStatusForDisplay,
  formatDocumentType,
  getDocumentTypeClassName,
  formatActivityLog,
  getDescriptionExcerpt,
  isDocOverdue
}) {
  const badge = getBadgeForDocument(doc)
  const dueStatus = getDueStatus(doc.due_date)
  const documentActivityLogs = activityLogs[doc.id] || []
  const hasEdited = (editedCounts[doc.id] || 0) > 0
  const hasReachedEditLimit = userRole === 'staff' && (editCounts[doc.id] || 0) >= 3

  void formatStatusForDisplay
  void isDocOverdue

  return (
    <article className="document-card">
      {editingId === doc.id ? (
        <div className="edit-panel">
          <h3 className="edit-title">Edit Document</h3>
          <div className="form-group">
            <label htmlFor={`edit-beneficiary-${doc.id}`}>Beneficiary</label>
            <input
              id={`edit-beneficiary-${doc.id}`}
              type="text"
              value={editBeneficiary}
              onChange={(e) => setEditBeneficiary(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor={`edit-reference-${doc.id}`}>Reference Number / Payment Voucher Number</label>
            <input
              id={`edit-reference-${doc.id}`}
              type="text"
              value={editReference}
              onChange={(e) => setEditReference(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor={`edit-batch-${doc.id}`}>Batch Number</label>
            <input
              id={`edit-batch-${doc.id}`}
              type="text"
              value={editBatchNumber}
              onChange={(e) => setEditBatchNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor={`edit-desc-${doc.id}`}>Description</label>
            <textarea
              id={`edit-desc-${doc.id}`}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor={`edit-amount-${doc.id}`}>Amount</label>
            <input
              id={`edit-amount-${doc.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              required
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
            <button type="button" className="btn btn-primary" onClick={() => onInlineEditSave(doc)}>
              Save
            </button>
            <button type="button" className="btn btn-neutral" onClick={onCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card-top-row">
            <span className={`document-type-pill ${getDocumentTypeClassName(doc.document_type)}`}>
              {formatDocumentType(doc.document_type)}
            </span>
          </div>
          <h3 className="document-title">{doc.beneficiary || 'N/A'}</h3>
          <p className="document-reference">PV No: {doc.reference || 'N/A'}</p>
          <p className="document-batch">Batch No: {doc.batch_number || 'N/A'}</p>
          <p className="document-description">{getDescriptionExcerpt(doc.description)}</p>
          <p className="document-amount">Amount: ₦ {formatAmount(doc.amount)}</p>
          <div className="status-row">
            <span className={`status-pill ${badge.className}`}>{badge.label}</span>
            {hasEdited && <span className="edited-pill">Edited</span>}
          </div>
          {doc.status === 'completed' ? (
            <p className="document-due due-sent">
              Sent on: {doc.date_out ? formatDueDate(doc.date_out) : 'N/A'}
            </p>
          ) : (
            <p className={`document-due ${dueStatus === 'overdue' ? 'due-overdue' : ''}`}>
              Due Date: {formatDueDate(doc.due_date)} ({getDueText(doc.due_date)})
            </p>
          )}

          <div className="status-control">
            <label htmlFor={`status-${doc.id}`}>Status</label>
            <select
              id={`status-${doc.id}`}
              value={doc.status}
              onChange={(e) => onStatusChange(doc, e.target.value, userRole)}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Sent</option>
            </select>
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => onEditClick(doc, userRole)}
              disabled={hasReachedEditLimit}
              title={hasReachedEditLimit ? 'Edit limit reached. Contact your administrator.' : undefined}
            >
              Edit
            </button>
            <button type="button" className="btn btn-danger btn-small" onClick={() => onDeleteClick(doc.id)}>
              Delete
            </button>
            <button
              type="button"
              className={`btn btn-neutral btn-small ${historyExpandedId === doc.id ? 'btn-active' : ''}`}
              onClick={() => onToggleHistory(doc.id)}
            >
              {historyExpandedId === doc.id ? 'Hide History' : 'View History'}
            </button>
          </div>
          {hasReachedEditLimit && <p className="edit-limit-msg">Edit limit reached. Contact your administrator.</p>}
          {permissionMessages[doc.id] && <p className="inline-permission-msg">{permissionMessages[doc.id]}</p>}

          {historyExpandedId === doc.id && (
            <div className="activity-history">
              {documentActivityLogs.length === 0 && <p className="empty-msg">No activity yet.</p>}
              {documentActivityLogs.length > 0 && (
                <ul className="activity-list">
                  {documentActivityLogs.map((log) => (
                    <li key={log.id} className="activity-item">
                      <span className="activity-message">{formatActivityLog(log, currentUserId, activityLogUsers)}</span>
                      <span className="activity-meta">
                        {' '}
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
}
