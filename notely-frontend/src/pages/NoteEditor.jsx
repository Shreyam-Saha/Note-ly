import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CodeBlockComponent from "../components/editor/CodeBlockComponent";
import { CustomImage } from "../components/editor/CustomImageExtension";
import { ImagePlaceholder } from "../components/editor/ImagePlaceholderExtension";
import { common, createLowlight } from "lowlight";
import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import debounce from "lodash/debounce";
import api from "../services/api";
import supabase from "../config/supabase";
import { toast } from "sonner";
import Toolbar from "../components/Toolbar";
import ShareDialog from "../components/ShareDialog";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { SlashCommands, getSuggestionItems, renderItems } from "../components/editor/slashExtension";
import "highlight.js/styles/github-dark.css";

const lowlight = createLowlight(common);

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

  const debouncedSaveTitle = useMemo(
    () => debounce(async (id, newTitle) => {
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

const uploadImage = async (file) => {
  if (!file) return null;
  
  // Compress image
  let compressedFile = file;
  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    compressedFile = await imageCompression(file, options);
  } catch (error) {
    console.error("Image compression error:", error);
    // fallback to original file if compression fails
  }

  const fileExt = compressedFile.name && compressedFile.name.includes('.') ? compressedFile.name.split('.').pop() : compressedFile.type.split('/')[1] || 'png';
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, compressedFile);

  if (error) {
    console.error("Upload error:", error);
    toast.error("Failed to upload image. Please check your connection.");
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

function EditorWorkspace({ provider, ydoc, isReadOnly, user, userColor, title, handleTitleChange, setSaving }) {
  const handleImageInsertion = (file, view, coordinates = null) => {
    if (!file.type.startsWith('image/')) return;
    
    const id = uuidv4();
    const pos = coordinates ? coordinates.pos : view.state.selection.to;
    const placeholderNode = view.state.schema.nodes.imagePlaceholder.create({ id });
    
    view.dispatch(view.state.tr.insert(pos, placeholderNode));

    uploadImage(file).then((url) => {
      const state = view.state;
      let placeholderPos = null;
      state.doc.descendants((node, p) => {
        if (node.type.name === 'imagePlaceholder' && node.attrs.id === id) {
          placeholderPos = p;
        }
      });

      if (placeholderPos !== null) {
        if (url) {
          const imageNode = state.schema.nodes.image.create({ src: url });
          view.dispatch(state.tr.replaceWith(placeholderPos, placeholderPos + 1, imageNode));
        } else {
          view.dispatch(state.tr.delete(placeholderPos, placeholderPos + 1));
        }
      }
    });
  };

  const handleToolbarImageUpload = (file) => {
    if (editor) {
      handleImageInsertion(file, editor.view);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Collaborative history is handled by Yjs
        codeBlock: false,
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
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }).configure({
        lowlight,
      }),
      CustomImage.configure({
        allowBase64: true,
      }),
      ImagePlaceholder,
      GlobalDragHandle.configure({
        dragHandleWidth: 20,
      }),
      SlashCommands.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
        },
      }),
    ],
    editorProps: {
      // eslint-disable-next-line no-unused-vars
      handleDrop: function(view, event, _slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageInsertion(file, view, view.posAtCoords({ left: event.clientX, top: event.clientY }));
            return true;
          }
        }
        return false;
      },
      // eslint-disable-next-line no-unused-vars
      handlePaste: function(view, event, _slice) {
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          let handled = false;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
              event.preventDefault();
              handled = true;
              handleImageInsertion(file, view);
            }
          }
          if (handled) return true;
        }

        // Fallback for some browsers that only use items
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.startsWith('image/') && item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              handleImageInsertion(file, view);
              return true;
            }
          }
        }
        return false;
      },
    },
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
      {!isReadOnly && <Toolbar editor={editor} onImageUpload={handleToolbarImageUpload} />}
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
