'use client';
import { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Toolbar } from '@/components/Toolbar';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function BlogEditor({ 
  initialPost, 
  content,
  setContent
}) {
  const [mounted, setMounted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [title, setTitle] = useState(initialPost?.title || '');
  const [hours, setHours] = useState(initialPost?.hours || 0);
  const [publishDate, setPublishDate] = useState(
    initialPost?.publish_date ? new Date(initialPost.publish_date) : new Date()
  );
  const [tags, setTags] = useState(initialPost?.tags?.join(', ') || '');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    // ... other fields
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
          HTMLAttributes: {
            class: 'my-heading-style'
          }
        },
        code: {
          HTMLAttributes: {
            class: 'bg-muted px-1.5 py-0.5 rounded'
          }
        },
        strike: {},
        paragraph: {
          HTMLAttributes: {
            style: 'white-space: pre-wrap;'
          }
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'mx-auto rounded-md shadow-md aspect-video object-scale-down',
          style: 'max-width: 600px; height: auto;',
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your blog post...',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);
      
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
      
      const minutes = Math.ceil(words.length / 200);
      setReadTime(`${minutes} min${minutes !== 1 ? 's' : ''}`);
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] p-6',
        style: 'white-space: pre-wrap;'
      },
      handleDOMEvents: {
        keydown: (_view, event) => {
          console.log('Key Pressed:', event.key);
          if (event.key === 'Enter') {
            const { state } = editor;
            const { $from } = state.selection;
            const currentAlignment = $from.parent.attrs.textAlign || 'left';
            setTimeout(() => {
              editor.commands.setTextAlign(currentAlignment);
            });
          }
        },
      },
    },
    onCreate: ({ editor }) => {
      const images = editor.view.dom.querySelectorAll('img');
      images.forEach(img => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.classList.add('rounded-md', 'shadow-md');
      });
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      console.log('Editor initialized with content:', editor.getHTML());
    }
  }, [editor]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      console.log('Content prop changed:', content);
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      toast.loading('Uploading image...', { id: 'imageUpload' });
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();
      if (editor && !editor.isDestroyed) {
        editor.commands.setImage({ src: url });
      }
      toast.success('Image uploaded successfully!', { id: 'imageUpload' });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image', { id: 'imageUpload' });
    }
  }, [editor]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return <div className="h-[600px] w-full rounded-lg bg-muted/50 animate-pulse" />;
  }

  const editorGuide = [
    { title: "Formatting Text", content: "Use the toolbar to format your text. You can make text **bold**, *italic*, or create headings." },
    { title: "Adding Images", content: "Click the image button in the toolbar or use the 'Upload Image' button below the editor to add images to your blog post." },
    { title: "Creating Lists", content: "Use the toolbar to create ordered (numbered) or unordered (bullet) lists." },
    { title: "Text Alignment", content: "Align your text to the left, center, or right using the alignment buttons in the toolbar." },
    { title: "Keyboard Shortcuts", content: "- Bold: Ctrl+B\n- Italic: Ctrl+I\n- Heading: Ctrl+Alt+1-6\n- Undo: Ctrl+Z\n- Redo: Ctrl+Shift+Z" },
  ];

  // Update the editor change handler to properly set content
  editor.on('update', () => {
    const html = editor.getHTML();
    setContent(html);
    const event = new Event('editor-change');
    window.dispatchEvent(event);
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error.message);
      }
      // Handle success
    } catch (error) {
      console.error('Error:', error);
      // Show error to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.content.trim();

  return (
    <div className="flex flex-col h-full bg-background rounded-lg shadow-xl border border-border w-full transition-all">
      <div className="flex justify-between items-center p-4 border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Blog Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <HelpCircle className="h-4 w-4" />
                Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Editor Guide</DialogTitle>
                <DialogDescription>
                  Tips and shortcuts to help you write better blog posts
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="basics" className="mt-4">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="basics">Basics</TabsTrigger>
                  <TabsTrigger value="tips">Writing Tips</TabsTrigger>
                  <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
                </TabsList>
                <TabsContent value="basics" className="space-y-4 mt-4">
                  {editorGuide.map((item, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <h3 className="font-medium mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="tips" className="space-y-4 mt-4">
                  <div className="border rounded-md p-3">
                    <h3 className="font-medium mb-1">Start with an Outline</h3>
                    <p className="text-sm text-muted-foreground">Create a structure for your post before filling in the details.</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h3 className="font-medium mb-1">Use Subheadings</h3>
                    <p className="text-sm text-muted-foreground">Break up your content with descriptive subheadings to improve readability.</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h3 className="font-medium mb-1">Keep Paragraphs Short</h3>
                    <p className="text-sm text-muted-foreground">Aim for 3-4 sentences per paragraph to make your content more scannable.</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h3 className="font-medium mb-1">Include Images</h3>
                    <p className="text-sm text-muted-foreground">Visual content increases engagement and helps illustrate your points.</p>
                  </div>
                </TabsContent>
                <TabsContent value="shortcuts" className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border rounded-md p-3">
                      <span className="bg-muted px-2 py-1 rounded text-sm font-mono">Ctrl+B</span>
                      <span className="ml-2">Bold</span>
                    </div>
                    <div className="border rounded-md p-3">
                      <span className="bg-muted px-2 py-1 rounded text-sm font-mono">Ctrl+I</span>
                      <span className="ml-2">Italic</span>
                    </div>
                    <div className="border rounded-md p-3">
                      <span className="bg-muted px-2 py-1 rounded text-sm font-mono">Ctrl+Alt+1</span>
                      <span className="ml-2">Heading 1</span>
                    </div>
                    <div className="border rounded-md p-3">
                      <span className="bg-muted px-2 py-1 rounded text-sm font-mono">Ctrl+Alt+2</span>
                      <span className="ml-2">Heading 2</span>
                    </div>
                    <div className="border rounded-md p-3">
                      <span className="bg-muted px-2 py-1 rounded text-sm font-mono">Ctrl+Z</span>
                      <span className="ml-2">Undo</span>
                    </div>
                    <div className="border rounded-md p-3">
                      <span className="bg-muted px-2 py-1 rounded text-sm font-mono">Ctrl+Shift+Z</span>
                      <span className="ml-2">Redo</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden md:flex items-center gap-1"
            type="button"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="hidden lg:inline">Hide Preview</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="hidden lg:inline">Show Preview</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 min-h-0">
        <div className={`flex-1 flex flex-col ${showPreview ? 'w-1/2 border-r border-border' : 'w-full'}`}>
          <div className="sticky top-[68px] z-10 bg-background border-b border-border">
            <Toolbar editor={editor} />
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="text-xs font-medium">{wordCount} words</span>
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="text-xs font-medium">{readTime} read</span>
                </Badge>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1 py-2">
            <div className="px-6">
              <div className="prose dark:prose-invert max-w-none" style={{ 
                overflow: 'visible',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                padding: '0.5rem 0'
              }}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </ScrollArea>
        </div>
        
        {showPreview && (
          <div className="w-1/2">
            <div className="sticky top-[68px] z-10 bg-background p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <Badge variant="outline">
                <span className="text-xs font-medium">As it will appear</span>
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-6">
                <div className="max-w-2xl mx-auto">
                  <article
                    className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl"
                    dangerouslySetInnerHTML={{ 
                      __html: editor?.getHTML() || content.replace(/<img/g, '<img data-align="center"') 
                    }}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span>
              has real time saved system
          </span>
        </div>
        <div>
          <span>{wordCount} words • {readTime}</span>
        </div>
      </div>
    </div>
  );
}
