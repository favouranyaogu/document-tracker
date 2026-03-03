export default function Navbar({
  displayName,
  userRole,
  userEmail,
  notifications,
  notificationsOpen,
  onToggleNotifications,
  notificationsRef,
  accountMenuOpen,
  onToggleAccountMenu,
  accountMenuRef,
  onOpenPasswordModal,
  onLogout
}) {
  return (
    <header className="top-nav">
      <div className="nav-brand">
        <span className="brand-mark">DT</span>
        <div>
          <p className="brand-title">Document Tracker</p>
          <p className="brand-subtitle">SaaS Workspace</p>
        </div>
      </div>
      <div className="nav-user">
        <div className="notifications-menu" ref={notificationsRef}>
          <button
            type="button"
            className="notifications-trigger"
            onClick={onToggleNotifications}
            aria-label="Notifications"
          >
            <span className="bell-icon" />
            {notifications.length > 0 && (
              <span className="notifications-badge">{notifications.length}</span>
            )}
          </button>
          {notificationsOpen && (
            <div className="notifications-dropdown">
              <p className="notifications-heading">Notifications</p>
              {notifications.length === 0 && (
                <p className="notifications-empty">No alerts right now.</p>
              )}
              {notifications.length > 0 && (
                <ul className="notifications-list">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`notification-item notification-${n.type}`}
                      onClick={onToggleNotifications}
                    >
                      <p className="notification-beneficiary">{n.beneficiary}</p>
                      <p className="notification-message">{n.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="account-menu" ref={accountMenuRef}>
          <button
            type="button"
            className="account-trigger"
            onClick={onToggleAccountMenu}
          >
            <div className="user-identity">
              <span className="user-name">{displayName}</span>
              <span className={`role-badge role-badge-${userRole}`}>{userRole}</span>
            </div>
          </button>
          {accountMenuOpen && (
            <div className="account-dropdown">
              <button type="button" className="account-menu-item" onClick={onOpenPasswordModal}>
                Change Password
              </button>
              <button type="button" className="account-menu-item" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
        <span className="user-email">{userEmail}</span>
      </div>
    </header>
  )
}
