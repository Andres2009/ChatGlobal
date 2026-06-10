export default function MentionSuggestions({ suggestions, activeIndex, onSelect }) {
  if (!suggestions.length) return null;

  return (
    <ul className="mention-suggestions list-unstyled mb-0" role="listbox">
      {suggestions.map((user, index) => (
        <li key={user.id}>
          <button
            type="button"
            className={`mention-suggestion-item ${index === activeIndex ? 'active' : ''}`}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(user);
            }}
            role="option"
            aria-selected={index === activeIndex}
          >
            <span className="mention-suggestion-avatar">{user.username.charAt(0).toUpperCase()}</span>
            <span>@{user.username}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
