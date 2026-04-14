import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import debounce from "lodash/debounce";
import api from "../services/api";
import Toolbar from "../components/Toolbar";
import ShareDialog from "../components/ShareDialog";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

const colors = [
  "#958DF1", "#F98181", "#FBCE76", "#FFC75F", "#82C91E", "#4DABF7", "#3BC9DB", "#B197FC"
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);

  const userColor = useMemo(() => getRandomColor(), []);

  const debouncedSaveTitle = useCallback(
    debounce(async (id, newTitle) => {
      setSaving(true);
      try {
        await api.put(`/notes/${id}`, { title: newTitle });
      } catch (err) {
        console.error("Save title error:", err);
      } finally {
        setSaving(false);
      }
    }, 1000),
    []
  );

  // Initialize Hocuspocus Provider
  useEffect(() => {
    const doc = new Y.Doc();
    setYdoc(doc);
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:5000";
    
    const newProvider = new HocuspocusProvider({
      url: wsUrl,
      name: id,
      document: doc,
    });

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
      setProvider(null);
      setYdoc(null);
    };
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function fetchNote() {
      try {
        const res = await api.get(`/notes/${id}`);
        if (!ignore) {
          setNote(res.data);
          setTitle(res.data.title || "");
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError(err.response?.status === 404 ? "Note not found or access denied" : "Failed to load note");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchNote();

    return () => {
      ignore = true;
    };
  }, [id]);

  // Handle read-only state based on permissions
  const isOwner = note?.ownerId === user?.id;
  const userShare = note?.shares?.find(s => s.userEmail === user?.email);
  const canEdit = isOwner || userShare?.role === "EDIT";
  const isReadOnly = !loading && !error && !canEdit;

  const handleTitleChange = (e) => {
    if (!canEdit) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    if (newTitle.trim().length > 0) {
      debouncedSaveTitle(id, newTitle.trim());
    }
  };

  if (loading || !provider) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
          {isOwner && <ShareDialog noteId={id} />}
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {isReadOnly ? "Read Only" : (saving ? "Saving..." : "Saved")}
        </span>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden bg-background">
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full bg-card shadow-sm border-x border-b">
          <EditorWorkspace 
            key={ydoc?.clientID || "editor"}
            provider={provider} 
            ydoc={ydoc}
            isReadOnly={isReadOnly} 
            user={user} 
            userColor={userColor} 
            title={title}
            handleTitleChange={handleTitleChange}
            setSaving={setSaving}
          />
        </div>
      </div>
    </div>
  );
}

function EditorWorkspace({ provider, ydoc, isReadOnly, user, userColor, title, handleTitleChange, setSaving }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Collaborative history is handled by Yjs
      }),
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider,
        user: {
          name: user?.email || "Anonymous",
          color: userColor,
        },
      }),
    ],
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  // Listen to provider connection status for saving indicator
  useEffect(() => {
    if (!provider) return;

    const handleSynced = () => setSaving(false);
    const handleUpdate = () => setSaving(true);
    
    provider.on("synced", handleSynced);
    
    if (editor) {
       editor.on("update", handleUpdate);
       
       let timeout;
       const handleStopSaving = () => {
         clearTimeout(timeout);
         timeout = setTimeout(() => setSaving(false), 1000);
       };
       editor.on("update", handleStopSaving);
       
       return () => {
         editor.off("update", handleUpdate);
         editor.off("update", handleStopSaving);
         provider.off("synced", handleSynced);
         clearTimeout(timeout);
       };
    }
  }, [provider, editor, setSaving]);

  return (
    <>
      {!isReadOnly && <Toolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto p-8 sm:p-12">
        <input
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={handleTitleChange}
          readOnly={isReadOnly}
          className="w-full text-4xl font-bold bg-transparent border-none outline-none mb-8 placeholder:text-muted-foreground text-foreground disabled:opacity-100"
        />
        <EditorContent editor={editor} className="prose prose-invert prose-primary max-w-none focus:outline-none min-h-[500px]" />
      </div>
    </>
  );
}
