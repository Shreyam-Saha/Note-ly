import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import debounce from "lodash/debounce";
import api from "../services/api";
import Toolbar from "../components/Toolbar";
import ShareDialog from "../components/ShareDialog";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const debouncedSave = useCallback(
    debounce(async (id, data) => {
      setSaving(true);
      try {
        await api.put(`/notes/${id}`, data);
      } catch (err) {
        console.error("Save error:", err);
      } finally {
        setSaving(false);
      }
    }, 1000),
    []
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
    ],
    content: "",
  });

  useEffect(() => {
    let ignore = false;
    async function fetchNote() {
      try {
        const res = await api.get(`/notes/${id}`);
        if (!ignore) {
          setNote(res.data);
          setTitle(res.data.title || "");
          if (editor && res.data.content) {
            editor.commands.setContent(res.data.content);
          }
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
  }, [id, editor]);

  // Handle read-only state based on permissions
  const isOwner = note?.ownerId === user?.id;
  const userShare = note?.shares?.find(s => s.userEmail === user?.email);
  const canEdit = isOwner || userShare?.role === "EDIT";
  const isReadOnly = !loading && !error && !canEdit;

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  // Update debouncedSave closure for editor content changes
  useEffect(() => {
    if (editor && canEdit) {
      const handleUpdate = ({ editor }) => {
         debouncedSave(id, { content: editor.getJSON() });
      };
      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor, debouncedSave, id, canEdit]);

  const handleTitleChange = (e) => {
    if (!canEdit) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Only save to backend if title is not empty, to avoid 400 Bad Request
    if (editor && newTitle.trim().length > 0) {
      debouncedSave(id, { title: newTitle.trim(), content: editor.getJSON() });
    }
  };

  if (loading) {
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
        </div>
      </div>
    </div>
  );
}
