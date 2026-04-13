import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useParams, Link, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, LogOut, FileText, Loader2, Users, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AppLayout() {
  const [notes, setNotes] = useState([]);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = async (event) => {
    const nextDark = !isDark;

    if (!document.startViewTransition) {
      setIsDark(nextDark);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setIsDark(nextDark);
    });

    await transition.ready;

    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ];

    document.documentElement.animate(
      {
        clipPath: clipPath,
      },
      {
        duration: 800,
        easing: 'ease-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  };

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { logout, user } = useAuth();

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get("/notes");
      setNotes(res.data.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, location.pathname]); // Re-fetch when navigating to catch title updates

  const handleCreateNote = async () => {
    setCreating(true);
    try {
      const res = await api.post("/notes", { title: "Untitled", content: "" });
      await fetchNotes();
      navigate(`/note/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNote = async (e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    const previousNotes = [...notes];
    setNotes(notes.filter(n => n.id !== noteId));
    
    try {
      await api.delete(`/notes/${noteId}`);
      if (id === noteId) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
      setNotes(previousNotes);
      toast.error("Failed to delete note. Please try again.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar-background flex flex-col shrink-0 transition-all duration-300 hidden md:flex">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sidebar-foreground">
            <FileText className="w-5 h-5 text-primary" />
            <span>Notely</span>
          </div>
        </div>

        <div className="px-3 pb-2">
          <Button
            onClick={handleCreateNote}
            disabled={creating}
            className="w-full justify-start gap-2 shadow-none"
            variant="secondary"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            New Note
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Your Notes
          </h3>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-4 text-center">
              No notes yet. Create one!
            </p>
          ) : (
            <div className="space-y-1">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  to={`/note/${note.id}`}
                  className={cn(
                    "group flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors",
                    id === note.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {note.ownerId !== user?.id && <Users className="w-3.5 h-3.5 shrink-0 text-muted-foreground" title="Shared with you" />}
                    <span className="truncate">{note.title || "Untitled"}</span>
                  </div>
                  {note.ownerId === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-opacity shrink-0"
                      onClick={(e) => handleDeleteNote(e, note.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground truncate px-2">
              {user?.email}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <Outlet />
      </main>
    </div>
  );
}
