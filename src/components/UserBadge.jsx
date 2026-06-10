export default function UserBadge({ username, isCurrentUser = false }) {
  return (
    <div className={`user-badge ${isCurrentUser ? 'is-current' : ''}`}>
      <span className="user-badge-dot" />
      <span className="user-badge-name">{username}</span>
      {isCurrentUser && <span className="badge bg-primary-subtle text-primary ms-auto">Tú</span>}
    </div>
  );
}
