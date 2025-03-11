'use client';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  Code,
  Strikethrough,
  ScanLine,
  Maximize,
  Minimize,
  AlignJustify,
} from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { toast } from 'react-hot-toast';

export function Toolbar({ editor }) {
  if (!editor) return null;

  const handleImageUpload = (url) => {
    editor.chain().focus().setImage({ 
      src: url,
      dataAlign: 'center',
      HTMLAttributes: {
        class: 'aspect-video object-scale-down',
        style: 'max-width: 600px; height: auto;'
      }
    }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        data-active={editor.isActive('bold') ? 'true' : undefined}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        data-active={editor.isActive('italic') ? 'true' : undefined}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        data-active={editor.isActive('underline') ? 'true' : undefined}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        data-active={editor.isActive({ textAlign: 'left' }) ? 'true' : undefined}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        data-active={editor.isActive({ textAlign: 'center' }) ? 'true' : undefined}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        data-active={editor.isActive({ textAlign: 'right' }) ? 'true' : undefined}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        data-active={editor.isActive({ textAlign: 'justify' }) ? 'true' : undefined}
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        data-active={editor.isActive('heading', { level: 1 }) ? 'true' : undefined}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        data-active={editor.isActive('heading', { level: 2 }) ? 'true' : undefined}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        data-active={editor.isActive('heading', { level: 3 }) ? 'true' : undefined}
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        data-active={editor.isActive('heading', { level: 4 }) ? 'true' : undefined}
      >
        <Heading4 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        data-active={editor.isActive('strike') ? 'true' : undefined}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        data-active={editor.isActive('code') ? 'true' : undefined}
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.commands.insertContent('     ')}
        aria-label="Indent"
      >
        <IndentIcon className="h-4 w-4" />
      </Button>

      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        options={{
          resourceType: 'image',
          maxFileSize: 5000000,
          multiple: true
        }}
        onSuccess={(result) => handleImageUpload(result.info.secure_url)}
      >
        {({ open }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              if (typeof open === 'function') {
                open();
              } else {
                console.error('Cloudinary upload widget not initialized');
                toast.error('Image upload is currently unavailable');
              }
            }}
            aria-label="Insert image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        )}
      </CldUploadWidget>
    </div>
  );
} 