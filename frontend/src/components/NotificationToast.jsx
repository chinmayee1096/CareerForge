import { X } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotificationToast({ message, type = "info", duration = 4500 }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return undefined;
    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration, message]);

  if (!message || !visible) return null;
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  );
}
