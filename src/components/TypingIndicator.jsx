export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers.length) return null;

  let label;
  if (typingUsers.length === 1) {
    label = `${typingUsers[0].username} está escribiendo`;
  } else if (typingUsers.length === 2) {
    label = `${typingUsers[0].username} y ${typingUsers[1].username} están escribiendo`;
  } else {
    label = `${typingUsers.length} personas están escribiendo`;
  }

  return (
    <div className="typing-indicator animate-fade-in" aria-live="polite">
      <span className="typing-dots" aria-hidden="true">
        <span /><span /><span />
      </span>
      <span className="typing-text">{label}…</span>
    </div>
  );
}
