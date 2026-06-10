import UserBadge from './UserBadge';

export default function OnlineUsers({ users, currentUserId }) {
  return (
    <aside className="online-users-panel">
      <div className="online-users-header">
        <h2 className="h6 mb-0">
          <i className="bi bi-people-fill me-2" />
          Usuarios conectados ({users.length})
        </h2>
      </div>
      <div className="online-users-list">
        {users.length === 0 ? (
          <p className="text-muted small mb-0 px-3">No hay usuarios conectados.</p>
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
