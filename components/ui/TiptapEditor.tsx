"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Tulis konten di sini...",
}: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 border border-slate-300 rounded-md",
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;

      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload gagal");
        }

        const data = await response.json();

        editor
          .chain()
          .focus()
          .setImage({ src: data.url })
          .run();

        toast.success("Gambar berhasil diupload");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Gagal mengupload gambar");
      } finally {
        setIsUploading(false);
      }
    },
    [editor]
  );

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadImage(file);
      }
    };
    input.click();
  };

  const addLink = () => {
    const url = window.prompt("Masukkan URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!isMounted || !editor) {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white p-4 min-h-[200px] flex items-center justify-center text-slate-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border-2 border-slate-400 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Toolbar dengan styling yang lebih jelas */}
      <div className="flex flex-wrap gap-1 p-3 border-b-2 border-slate-300 bg-gradient-to-b from-slate-100 to-slate-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("bold") 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("italic") 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("underline") 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("strike") 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>

        <div className="w-px h-8 bg-slate-400 mx-2" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("heading", { level: 1 }) 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("heading", { level: 2 }) 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("heading", { level: 3 }) 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </button>

        <div className="w-px h-8 bg-slate-400 mx-2" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("bulletList") 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive("orderedList") 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>

        <div className="w-px h-8 bg-slate-400 mx-2" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive({ textAlign: "left" }) 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Align Left"
        >
          <AlignLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive({ textAlign: "center" }) 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Align Center"
        >
          <AlignCenter size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive({ textAlign: "right" }) 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Align Right"
        >
          <AlignRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-2 rounded border transition-all ${
            editor.isActive({ textAlign: "justify" }) 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Align Justify"
        >
          <AlignJustify size={18} />
        </button>

        <div className="w-px h-8 bg-slate-400 mx-2" />

        <button
          type="button"
          onClick={addLink}
          className={`p-2 rounded border transition-all ${
            editor.isActive("link") 
              ? "bg-blue-600 text-white border-blue-700 shadow-md" 
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
          }`}
          title="Add Link"
        >
          <Link2 size={18} />
        </button>
        <button
          type="button"
          onClick={handleImageUpload}
          disabled={isUploading}
          className="p-2 rounded border bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Upload Image"
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="p-4 min-h-[300px] bg-white">
        <EditorContent 
          editor={editor} 
          className="outline-none prose prose-slate max-w-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-slate-900 [&_.ProseMirror]:text-base [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none" 
        />
      </div>
    </div>
  );
}
