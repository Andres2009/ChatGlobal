import { formatTime } from '../utils/formatDate';

export default function SystemMessage({ message }) {
  return (
    <div className="system-message animate-slide-in">
      <div className="system-message-content">
        <i className="bi bi-info-circle me-2" />
        <span>{message.content}</span>
        <time className="system-message-time">{formatTime(message.createdAt)}</time>
      </div>
    </div>
  );
}
