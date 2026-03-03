function InactivityModal({ countdown, onStayLoggedIn }) {
  if (!countdown || countdown <= 0) return null

  return (
    <div className="modal-overlay" onClick={onStayLoggedIn}>
      <div className="inactivity-modal" role="alertdialog" aria-modal="true">
        <h3 className="inactivity-modal-title">Session Expiring</h3>
        <p className="inactivity-modal-body">
          You'll be logged out in <strong>{countdown}</strong> second(s) due to inactivity.
        </p>
        <button type="button" className="btn btn-primary" onClick={onStayLoggedIn}>
          Stay Logged In
        </button>
      </div>
    </div>
  )
}

export default InactivityModal
