import UserBadge from './UserBadge';

export default function OnlineUsers({ users, currentUserId, isVisible }) {
  const panelClass = `online-users-panel${isVisible ? '' : ' panel-hidden'}`;

  const activeUsers = users.filter((u) => u.isActive !== false);
  const awayUsers   = users.filter((u) => u.isActive === false);

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
          <>
            {activeUsers.map((user) => (
              <UserBadge
                key={user.id}
                username={user.username}
                isCurrentUser={user.id === currentUserId}
                isActive
              />
            ))}

            {awayUsers.length > 0 && (
              <>
                <div className="users-section-label">
                  <i className="bi bi-moon-fill me-1" />
                  Ausentes ({awayUsers.length})
                </div>
                {awayUsers.map((user) => (
                  <UserBadge
                    key={user.id}
                    username={user.username}
                    isCurrentUser={user.id === currentUserId}
                    isActive={false}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
