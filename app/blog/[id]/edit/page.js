'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import BlogEditor from '@/components/BlogEditor';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Sun, Moon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function EditBlogPage() {
  const { user } = useUser();
  const router = useRouter();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(8);
  const [tags, setTags] = useState('');
  const [publishDate, setPublishDate] = useState(new Date());
  const [tagList, setTagList] = useState([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blog/posts?id=${id}`);
        const { data } = await response.json();
        setPost(data[0]);
        setTitle(data[0].title);
        setHours(data[0].hours);
        setTags(data[0].tags?.join(', ') || '');
        setPublishDate(new Date(data[0].publish_date));
      } catch (error) {
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    if (tags.trim()) {
      setTagList(tags.split(',').map(tag => tag.trim()).filter(Boolean));
    } else {
      setTagList([]);
    }
  }, [tags]);

  useEffect(() => {
    const handleInputChange = () => setHasUnsavedChanges(true);
    
    // Track form field changes
    const formElements = document.querySelectorAll('input, textarea, [contenteditable]');
    formElements.forEach(element => {
      element.addEventListener('input', handleInputChange);
    });

    // Track editor changes
    const handleEditorChange = () => setHasUnsavedChanges(true);
    window.addEventListener('editor-change', handleEditorChange);

    return () => {
      formElements.forEach(element => {
        element.removeEventListener('input', handleInputChange);
      });
      window.removeEventListener('editor-change', handleEditorChange);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to refresh?')) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasUnsavedChanges]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSubmit = async (updatedPost) => {
    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedPost,
          title,
          hours,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          publish_date: publishDate.toISOString()
        }),
      });

      if (!response.ok) throw new Error('Failed to update post');
      
      toast.success('Post updated successfully!', {
        duration: 4000,
        position: 'bottom-right',
        style: {
          backgroundColor: '#10b981',
          color: '#fff',
        },
        icon: '✅',
      });
      router.push(`/blog/${id}`);
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <Card className="mt-6">
      
      {/* Sticky Update Button */}
      <div className="fixed bottom-4 right-4 z-50">
        
        <Button 
          onClick={() => handleSubmit(post)}
          disabled={!hasUnsavedChanges}
          className="shadow-lg"
        >
          Update Post
        </Button>
      </div>

      <CardContent className="space-y-6">
        <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            <BlogEditor 
              initialPost={post}
              content={post?.content || ''}
              setContent={(newContent) => {
                setPost(prev => ({ ...prev, content: newContent }));
                setHasUnsavedChanges(true);
              }}
              onSubmit={(updatedPost) => {
                handleSubmit(updatedPost);
              }}
              onCancel={() => router.push(`/blog/${id}`)}
            />
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter an attention-grabbing title"
                className="text-lg"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hours" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hours Spent
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="hours"
                    value={[hours]}
                    onValueChange={([value]) => setHours(value)}
                    min={0}
                    max={24}
                    step={1}
                    className="w-[60%]"
                  />
                  <span className="w-20 px-3 py-2 border rounded-md text-sm text-center">
                    {hours} {hours === 1 ? 'hour' : 'hours'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishDate" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Publish Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {publishDate ? format(publishDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={publishDate}
                      onSelect={(date) => date && setPublishDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="flex items-center gap-2">
                Tags (comma separated)
              </Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. technology, programming, tutorial"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {tagList.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview Your Post</CardTitle>
                <CardDescription>
                  Review how your blog post will appear before publishing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 border-b pb-6">
                  <h1 className="text-3xl font-bold mb-4">{title || "Your Blog Title"}</h1>
                  
                  <div className="flex items-center gap-4 mb-4">
                    {user && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                          <AvatarFallback>{user.firstName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <div className="font-medium">{user.fullName || 'User'}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      {new Date(publishDate) > new Date() ? (
                        <>
                          <span className="text-yellow-500">Scheduled: </span>
                          {format(publishDate, "MMMM d, yyyy 'at' h:mm a")}
                        </>
                      ) : (
                        format(publishDate, "MMMM d, yyyy")
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : 'Less than an hour'}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tagList.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  {post?.content ? (
                    <article dangerouslySetInnerHTML={{ __html: post.content }} />
                  ) : (
                    <div className="text-muted-foreground italic">No content added yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 