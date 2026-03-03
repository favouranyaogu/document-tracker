function PasswordModal({
  currentPassword,
  newPassword,
  confirmNewPassword,
  passwordError,
  passwordSuccess,
  passwordUpdating,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  onSubmit,
  onCancel
}) {
  return (
    <div className="modal-overlay">
      <div className="password-modal" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
        <h3 id="change-password-title" className="password-modal-title">Change Password</h3>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-new-password">Confirm New Password</label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => onConfirmNewPasswordChange(e.target.value)}
              required
            />
          </div>
          {passwordError && <p className="error-msg">{passwordError}</p>}
          {passwordSuccess && <p className="success-msg">{passwordSuccess}</p>}
          <div className="password-modal-actions">
            <button type="submit" className="btn btn-primary" disabled={passwordUpdating}>
              {passwordUpdating ? 'Updating...' : 'Update Password'}
            </button>
            <button type="button" className="btn btn-neutral" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordModal
