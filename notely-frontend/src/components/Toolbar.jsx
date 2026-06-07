import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Toolbar({ editor, onImageUpload }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      setIsUploading(true);
      await onImageUpload(file);
      setIsUploading(false);
    }
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-background sticky top-0 z-10 flex-wrap">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-accent text-accent-foreground" : ""}
      >
        <Bold className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-accent text-accent-foreground" : ""}
      >
        <Italic className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? "bg-accent text-accent-foreground" : ""}
      >
        <Heading1 className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "bg-accent text-accent-foreground" : ""}
      >
        <Heading2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "bg-accent text-accent-foreground" : ""}
      >
        <List className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "bg-accent text-accent-foreground" : ""}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive("codeBlock") ? "bg-accent text-accent-foreground" : ""}
      >
        <Code className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      </Button>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleImageUpload} 
      />
    </div>
  );
}
