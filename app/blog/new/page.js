'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BlogEditor from '@/components/BlogEditor';
import { toast } from 'react-hot-toast';
import ErrorBoundary from "@/components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Clock, TagIcon, AlertCircle, Info, Send, Home } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { postSchema } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

export default function NewBlogPage() {
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hours, setHours] = useState(8);
  const [tags, setTags] = useState('');
  const [publishDate, setPublishDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagList, setTagList] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const router = useRouter();
  const [wordCount, setWordCount] = useState(0);
  const readTimeRef = useRef('0 min');
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const readTime = useRef(0);
  const [validationErrors, setValidationErrors] = useState({
    title: { valid: true, message: '' },
    content: { valid: true, message: '' },
    tags: { valid: true, message: '' }
  });

  // Add dynamic UI states
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isTagsFocused, setIsTagsFocused] = useState(false);
  const [isContentFocused, setIsContentFocused] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('draftBlogPost');
    if (savedData) {
      try {
        const { 
          title, 
          content, 
          hours = 8, 
          tags, 
          publishDate, 
          wordCount =  
          readTime = '0 min' 
        } = JSON.parse(savedData);
        
        setTitle(title || '');
        setContent(content || '');
        setHours(hours || 8);
        setTags(tags || '');
        if (publishDate) setPublishDate(new Date(publishDate));
        setWordCount(wordCount);
        readTimeRef.current = readTime;
      } catch (error) {
        console.error('Error parsing saved draft:', error);
      }
    }
  }, []);

  // Update tag list whenever tags input changes
  useEffect(() => {
    if (tags.trim()) {
      setTagList(tags.split(',').map(tag => tag.trim()).filter(Boolean));
    } else {
      setTagList([]);
    }
  }, [tags]);

  // Keep this useEffect for saving on field changes
  useEffect(() => {
    const saveData = {
      title,
      content,
      hours,
      tags,
      publishDate: publishDate.toISOString(),
      wordCount,
      readTime: readTimeRef.current,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('draftBlogPost', JSON.stringify(saveData));
    setLastSaved(new Date());
  }, [title, content, hours, tags, publishDate, wordCount, readTimeRef]);

  useEffect(() => {
    const words = content.split(/\s+/).length;
    readTime.current = Math.ceil(words / 200);
  }, [content]);

  useEffect(() => {
    const errors = {
      title: validateField('title', title),
      content: { valid: true, message: '' },
      tags: validateField('tags', tagList)
    };

    // Add explicit check for empty content
    if (!content || content.trim().length === 0) {
      errors.content = { valid: false, message: 'Content is required' };
    } else if (content.length < 20) {
      errors.content = { valid: false, message: 'Content must be at least 20 characters' };
    }

    setValidationErrors(prev => ({
      ...prev,
      ...errors
    }));
  }, [title, content, tagList]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handlePublishConfirmation = () => {
    setShowPublishConfirmation(true);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    // Check content validation explicitly
    if (!content || content.trim().length === 0) {
      toast.error('Content is required');
      return;
    }

    if (Object.values(validationErrors).some(error => !error.valid)) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    if (!user?.id) {
      toast.error('Please sign in to create a blog post');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Starting submission process...');
      
      // Format tags
      const formattedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      console.log('Formatted tags:', formattedTags);
      
      // Prepare request body with publish_date
      const requestBody = {
        title,
        content,
        hours,
        tags: formattedTags,
        publish_date: publishDate.toISOString()
      };
      console.log('Request body:', requestBody);
      
      // Send POST request to /api/blog
      console.log('Sending request to /api/blog...');
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response received:', response);
      
      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error?.message || 'Failed to publish post');
      }

      const result = await response.json();
      console.log('Success response:', result);
      
      // Clear draft and redirect
      localStorage.removeItem('draftBlogPost');
      setHasUnsavedChanges(false);
      toast.success('Blog post published successfully!');
      router.push(`/`);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this modal component
  const PublishConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background p-6 rounded-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Confirm Publish</h2>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to publish this blog post? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPublishConfirmation(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Uploading...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );

  // Update validation to show real-time feedback
  const validateField = (field, value) => {
    try {
      const fieldSchema = postSchema.shape[field];
      if (!fieldSchema) {
        return { valid: false, message: 'Invalid field' };
      }

      fieldSchema.parse(value);
      return { valid: true, message: '' };
    } catch (error) {
      return { 
        valid: false, 
        message: error?.errors?.[0]?.message || 'Invalid value'
      };
    }
  };

  // Update the input components with dynamic styling
  const getInputClass = (field) => {
    const error = validationErrors[field];
    return cn(
      'transition-all duration-300',
      {
        'border-red-500': !error.valid && error.isFocused,
        'ring-2 ring-red-500/50': !error.valid && error.isFocused,
        'border-green-500': error.valid && error.isFocused,
        'ring-2 ring-green-500/50': error.valid && error.isFocused
      }
    );
  };

  // Add real-time character counters
  const CHAR_LIMITS = {
    title: 100,
    description: 200
  };

  // Add these components near the inputs
  {isTitleFocused && (
    <div className="text-xs text-muted-foreground mt-1">
      {title.length}/{CHAR_LIMITS.title} characters
    </div>
  )}

  // Update the ValidationReminder component
  const ValidationReminder = () => {
    const activeErrors = Object.entries(validationErrors)
      .filter(([_, error]) => !error.valid);

    if (activeErrors.length === 0) return null;

    return (
      <div 
        className="fixed top-5 right-5 bg-background border border-red-500/20 rounded-lg shadow-lg p-4 max-w-xs"
        style={{ zIndex: 9999999 }}
      >
        <h3 className="font-medium text-red-500 mb-2">Requirements</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          {activeErrors.map(([field, error]) => (
            <li key={field} className="flex items-center gap-2">
              <span className="text-red-500">•</span>
              <div>
                <span className="capitalize">{field}: </span>
                {error.message}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="container max-w-6xl py-8 mx-auto px-4">
      <ValidationReminder />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Create New Blog Post</h1>
            <p className="text-muted-foreground mt-1">Share your thoughts, experiences, and expertise</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                <AvatarFallback>{user.firstName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">{user.fullName || 'User'}</div>
                <div className="text-xs text-muted-foreground">Author</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="editor">Content</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog Content</CardTitle>
              <CardDescription>
                Write the title and content of your blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  onFocus={() => setIsTitleFocused(true)}
                  onBlur={() => setIsTitleFocused(false)}
                  placeholder="Enter an attention-grabbing title"
                  className={cn('text-lg', getInputClass('title'))}
                  required
                />
              </div>        
              <div className="space-y-2">
                <Label>Content</Label>
                <div className={cn(
                  'w-full border rounded-lg overflow-hidden transition-all duration-300',
                  getInputClass('content')
                )}
                  onFocus={() => setIsContentFocused(true)}
                  onBlur={() => setIsContentFocused(false)}
                >
                  <ErrorBoundary>
                    <BlogEditor 
                      content={content} 
                      setContent={handleContentChange}
                      lastSaved={lastSaved}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
              <Button 
                type="button" 
                onClick={() => setActiveTab('metadata')}
                className="flex items-center gap-2"
              >
                Continue to Metadata
                <span className="ml-1">→</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog Metadata</CardTitle>
              <CardDescription>
                Add additional information about your blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <p className="text-xs text-muted-foreground">
                    How much time did you work today?
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    When should this post be published?
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags" className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Tags (comma separated)
                </Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  onFocus={() => setIsTagsFocused(true)}
                  onBlur={() => setIsTagsFocused(false)}
                  placeholder="e.g. technology, programming, tutorial"
                  className={getInputClass('tags')}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {tagList.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Tips for better discoverability</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Use 3-5 relevant tags to categorize your post</li>
                    <li>Include a descriptive summary that highlights key points</li>
                    <li>Add a compelling title that includes keywords people search for</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setActiveTab('editor')}
                className="flex items-center gap-2"
              >
                <span className="mr-1">←</span>
                Back to Content
              </Button>
              <Button 
                type="button" 
                onClick={() => setActiveTab('preview')}
                className="flex items-center gap-2"
              >
                Continue to Preview
                <span className="ml-1">→</span>
              </Button>
              
            </CardFooter>
            
          </Card>
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
                {content ? (
                  <article dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <div className="text-muted-foreground italic">No content added yet.</div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setActiveTab('metadata')}
                className="flex items-center gap-2"
              >
                <span className="mr-1">←</span>
                Back to Metadata
              </Button>
              <Button 
                type="button"
                onClick={handlePublishConfirmation}
                disabled={isSubmitting || Object.values(validationErrors).some(error => !error.valid) || !content || content.trim().length === 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {new Date(publishDate) > new Date() ? 'Schedule Post' : 'Publish Now'}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="bg-muted p-4 rounded-lg flex items-start gap-3 mt-6">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Final Checklist</h4>
              <ul className="text-sm text-muted-foreground space-y-2 list-inside">
                <li className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <span>Double-check your content for spelling and grammar errors</span>
                </li>
                <li className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <span>Make sure you&apos;ve added appropriate tags for better discoverability</span>
                </li>
                <li className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <span>Verify any links in your content work correctly</span>
                </li>
                <li className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <span>Confirm images are properly sized and positioned</span>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
      </Tabs>

      {showPublishConfirmation && <PublishConfirmationModal />}
    </div>
  );
}