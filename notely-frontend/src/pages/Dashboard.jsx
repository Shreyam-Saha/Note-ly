import { useEffect, useState } from "react";
import api from "../services/api";
import "../App.css";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    api.get("/notes").then((res) => {
      if (!ignore) {
        setNotes(Array.isArray(res.data.data) ? res.data.data : []);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="mesh-bg"></div>

      {/* Sidebar */}
      <aside className="sidebar glass">
        <div className="brand" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="url(#brandGradient)" />
            <path d="M12 14H28M12 20H20M12 26H24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#bd9dff" />
                <stop offset="1" stopColor="#9492ff" />
              </linearGradient>
            </defs>
          </svg>
          <h2 style={{ fontSize: '1.25rem' }}>Note-ly</h2>
        </div>

        <nav>
          <div className="nav-link active">
            <span className="icon">📄</span>
            All Notes
          </div>
          <div className="nav-link">
            <span className="icon">⭐️</span>
            Favorites
          </div>
          <div className="nav-link">
            <span className="icon">📁</span>
            Folders
          </div>
          <div className="nav-link">
            <span className="icon">🗑️</span>
            Trash
          </div>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <div className="nav-link">
            <span className="icon">⚙️</span>
            Settings
          </div>
          <div className="nav-link" onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}>
            <span className="icon">🚪</span>
            Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-layout animate-fade-in">
        <header className="topbar">
          <div className="search-group" style={{ flex: 1, maxWidth: '400px' }}>
            <input className="input-field" placeholder="Search notes..." />
          </div>
          <button className="btn-primary" style={{ gap: '0.5rem' }}>
            <span>+</span>
            New Note
          </button>
        </header>

        <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>All Notes</h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
            Initialising your workspace...
          </div>
        ) : notes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed', background: 'transparent' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>No entries yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Start your enterprise knowledge base by creating your first note.</p>
          </div>
        ) : (
          <div className="note-grid">
            {notes.map((note) => (
              <div key={note.id} className="note-card animate-fade-in">
                <h3 className="note-title">{note.title || 'Untitled Note'}</h3>
                <p className="note-preview">
                  {typeof note.content === 'object' ? JSON.stringify(note.content).slice(0, 100) : note.content || 'Click to view details...'}
                </p>
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', background: 'var(--bg-surface-highest)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                    Enterprise
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
        }

        .icon {
          font-size: 1.1rem;
        }

        .search-group {
          position: relative;
        }
      `}</style>
    </div>
  );
}