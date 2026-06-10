import { renderMessageWithMentions } from '../utils/mentions';

export default function QuoteBlock({ replyTo, currentUsername, compact = false }) {
  if (!replyTo) return null;

  const parts = renderMessageWithMentions(replyTo.content, currentUsername);

  return (
    <blockquote className={`quote-block ${compact ? 'compact' : ''}`}>
      <cite className="quote-block-author">@{replyTo.username}</cite>
      <p className="quote-block-content">
        {parts.map((part, index) =>
          part.type === 'mention' ? (
            <span key={`${part.value}-${index}`} className="mention-tag">
              {part.value}
            </span>
          ) : (
            <span key={`text-${index}`}>{part.value}</span>
          )
        )}
      </p>
    </blockquote>
  );
}
