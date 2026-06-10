import UserBadge from './UserBadge';

export default function OnlineUsers({ users, currentUserId, isVisible }) {
  // On desktop the CSS forces display:flex regardless of isVisible.
  // On mobile/tablet, panel-hidden hides it until the toggle opens it.
  const panelClass = `online-users-panel${isVisible ? '' : ' panel-hidden'}`;

  return (
    <aside className={panelClass}>
      <div className="online-users-header">
        <h2 className="h6 mb-0">
          <i className="bi bi-people-fill me-2" />
          Conectados ({users.length})
        </h2>
      </div>
      <div className="online-users-list">
        {users.length === 0 ? (
          <p className="text-muted small mb-0 px-2">No hay usuarios.</p>
        ) : (
          users.map((user) => (
            <UserBadge
              key={user.id}
              username={user.username}
              isCurrentUser={user.id === currentUserId}
            />
          ))
        )}
      </div>
    </aside>
  );
}
