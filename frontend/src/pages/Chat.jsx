import { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";
import ConversationSidebar from "../components/chat/ConversationSidebar.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { UserPlus } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);

  const loadConversations = useCallback(async (search = "") => {
    try {
      const url = search ? `/chat/conversations?search=${encodeURIComponent(search)}` : "/chat/conversations";
      const { data } = await api.get(url);
      setConversations(data.data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadConversations();
        // Load assignable peers (mentors for students, students for mentors)
        const endpoint = user?.role === "student" ? "/students/profile" : "/students";
        const { data } = await api.get(endpoint);
        if (user?.role === "student" && data.data?.mentorId) {
          // For student: only their assigned mentor
          setPeers([{ _id: data.data.mentorId, name: "My Mentor", role: "mentor" }]);
        } else if (user?.role === "mentor") {
          setPeers((data.data || []).map((s) => ({ _id: s.userId?._id, name: s.userId?.name, role: "student" })));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadConversations, user?.role]);

  const startConversation = async (peerId) => {
    try {
      const { data } = await api.post("/chat/conversations", { participantId: peerId });
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === data.data._id);
        return exists ? prev : [data.data, ...prev];
      });
      setSelected(data.data);
      setShowNewChat(false);
    } catch {
      // silent
    }
  };

  if (loading) return <Loader label="Loading messages" />;

  return (
    <>
      <div className="page-title row">
        <div>
          <h1>Messages</h1>
          <p>Real-time communication with your {user?.role === "student" ? "mentor" : "students"}.</p>
        </div>
        {peers.length > 0 && (
          <button className="primary-button" onClick={() => setShowNewChat(true)} id="new-chat-btn">
            <UserPlus size={17} /> New conversation
          </button>
        )}
      </div>

      {showNewChat && (
        <div className="modal-backdrop" onClick={() => setShowNewChat(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>Start a conversation</strong>
              <button className="icon-button" onClick={() => setShowNewChat(false)}>✕</button>
            </div>
            <div className="stack">
              {peers.filter((p) => p._id).map((peer) => (
                <button
                  key={peer._id}
                  className="peer-select-btn"
                  onClick={() => startConversation(peer._id)}
                  id={`start-conv-${peer._id}`}
                >
                  <div className="peer-avatar">{peer.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <strong>{peer.name}</strong>
                    <span className="muted" style={{ marginLeft: 8 }}>{peer.role}</span>
                  </div>
                </button>
              ))}
              {peers.length === 0 && <p className="muted">No peers assigned yet.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="chat-layout">
        <ConversationSidebar
          conversations={conversations}
          selected={selected}
          onSelect={setSelected}
          onSearch={loadConversations}
        />
        <ChatWindow
          conversation={selected}
          key={selected?._id}
        />
      </div>
    </>
  );
}
