import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    async function fetchNotes() {
      try {
        const res = await api.get("/notes");
        if (!ignore) setNotes(res.data.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchNotes();

    return () => { ignore = true; };
  }, []);

  const handleCreateNote = async () => {
    if (!title.trim()) return;
    try {
      await api.post("/notes", { title: title.trim(), content });
      setTitle("");
      setContent("");
      setCreating(false);
      const res = await api.get("/notes");
      setNotes(res.data.data);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Your Notes</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setCreating(!creating)}
            style={{
              padding: "8px 16px",
              backgroundColor: creating ? "#dc3545" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {creating ? "Cancel" : "Create Note"}
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "transparent",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {creating && (
        <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc", borderRadius: "6px" }}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "10px", boxSizing: "border-box" }}
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: "8px", marginBottom: "10px", boxSizing: "border-box" }}
          />
          <button
            onClick={handleCreateNote}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Save Note
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <p>No notes yet</p>
      ) : (
        notes.map((note) => (
          <div
            key={note.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          >
            <h3>{note.title || "Untitled"}</h3>
          </div>
        ))
      )}
    </div>
  );
}
