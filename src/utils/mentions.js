const MENTION_REGEX = /@([\p{L}\p{N}_-]+)/gu;

export function getMentionQuery(text, cursorPosition) {
  const beforeCursor = text.slice(0, cursorPosition);
  const match = beforeCursor.match(/@([\p{L}\p{N}_-]*)$/u);
  if (!match) return null;

  return {
    query: match[1],
    start: beforeCursor.lastIndexOf('@'),
  };
}

export function filterUsersForMention(users, query, currentUserId) {
  const normalized = query.toLowerCase();
  return users
    .filter((user) => user.id !== currentUserId)
    .filter((user) => user.username.toLowerCase().startsWith(normalized))
    .slice(0, 6);
}

export function insertMention(text, start, username) {
  const before = text.slice(0, start);
  const after = text.slice(start).replace(/^@[\p{L}\p{N}_-]*/u, '');
  return `${before}@${username} ${after}`;
}

export function renderMessageWithMentions(content, currentUsername) {
  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(MENTION_REGEX.source, 'gu');

  for (const match of content.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, index) });
    }

    const mentionName = match[1];
    const isSelf = currentUsername && mentionName.toLowerCase() === currentUsername.toLowerCase();

    parts.push({
      type: 'mention',
      value: `@${mentionName}`,
      isSelf,
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: 'text', value: content }];
}
