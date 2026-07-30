import { useAuth } from "../../context/AuthContext.jsx";
import { formatDistanceToNow } from "../../utils/dateUtils.js";
import { Paperclip, Trash2 } from "lucide-react";

export default function MessageBubble({ message, onDelete }) {
  const { user } = useAuth();
  const isMine = message.senderId?._id === user?._id || message.senderId === user?._id;

  return (
    <div className={`msg-bubble-wrapper ${isMine ? "mine" : "theirs"}`}>
      {!isMine && (
        <div className="msg-avatar" title={message.senderId?.name}>
          {message.senderId?.name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <div className={`msg-bubble ${isMine ? "bubble-mine" : "bubble-theirs"}`}>
        {!isMine && (
          <div className="msg-sender-name">{message.senderId?.name}</div>
        )}

        {message.isDeleted ? (
          <em className="msg-deleted">Message deleted</em>
        ) : (
          <>
            {message.content && <p className="msg-text">{message.content}</p>}
            {message.attachments?.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="msg-attachment"
              >
                <Paperclip size={14} />
                {att.originalName || "Attachment"}
              </a>
            ))}
          </>
        )}

        <div className="msg-meta">
          <span className="msg-time">{formatDistanceToNow(message.createdAt)}</span>
          {isMine && (
            <span className="msg-read-status" title={message.isRead ? "Seen" : "Delivered"}>
              {message.isRead ? "✓✓" : "✓"}
            </span>
          )}
          {isMine && !message.isDeleted && onDelete && (
            <button
              className="msg-delete-btn"
              onClick={() => onDelete(message._id)}
              title="Delete message"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
