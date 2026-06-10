export default function UserBadge({ username, isCurrentUser = false, isActive = true }) {
  return (
    <div className={`user-badge ${isCurrentUser ? 'is-current' : ''} ${isActive ? '' : 'is-away'}`}>
      <span className={`user-badge-dot ${isActive ? '' : 'is-away'}`} title={isActive ? 'En la ventana' : 'Ausente'} />
      <span className="user-badge-name">{username}</span>
      {isCurrentUser && <span className="badge bg-primary-subtle text-primary ms-auto">Tú</span>}
      {!isActive && <i className="bi bi-moon-fill user-away-icon" title="Ausente" />}
    </div>
  );
}
