import { notFound } from 'next/navigation';
import { getBlogPostById } from '@/utils/getBlogPosts';
import { format } from 'date-fns';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar, 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReactionButton from '@/components/ReactionButton';
import ShareButton from '@/components/ShareButton';
import { headers } from 'next/headers';
import AuthorInfo from '@/components/AuthorInfo';
import { ThemeToggle } from '@/components/theme-toggle';
import BlogPostActions from '@/components/BlogPostActions';
import BackButton from '@/components/BackButton';

export default async function BlogPostPage({ params }) {
  const { id } = await params;
  console.log('Fetching blog post with ID:', id);

  const post = await getBlogPostById(id);
  console.log('Fetched blog post:', post);

  if (!post) {
    notFound();
  }

  // Await headers before using them
  const headersList = await headers();
  const authorization = headersList.get('Authorization');

  // Parse tags function
  const parseTags = (tags) => {
    try {
      if (!tags) return [];
      if (typeof tags === 'string') {
        if (tags.startsWith('{') && tags.endsWith('}')) {
          return tags.replace(/^\{|\}$/g, '')
            .split(',')
            .map(tag => tag.trim().replace(/^"|"$/g, ''))
            .filter(Boolean);
        }
        try {
          return JSON.parse(tags);
        } catch {
          return tags.split(',').map(tag => tag.trim());
        }
      }
      return Array.isArray(tags) ? tags : [];
    } catch (error) {
      console.error('Error parsing tags:', error);
      return [];
    }
  };

  const tags = parseTags(post.tags);

  // Format date function
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Date unavailable';
    }
  };

  // Calculate reading time based on word count
  const calculateReadingTime = (content) => {
    // Strip HTML tags to get just the text
    const text = content.replace(/<[^>]*>?/gm, '');
    // Count words (approximately)
    const wordCount = text.split(/\s+/).length;
    // Average reading speed: 200 words per minute
    const minutes = Math.ceil(wordCount / 200);
    return minutes < 1 ? 1 : minutes;
  };

  const readingTimeMinutes = calculateReadingTime(post.content);

  // Add these functions for handling reactions
  const handleReaction = async (reactionType) => {
    try {
      const response = await fetch('/api/blog/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          reactionType
        })
      });

      if (!response.ok) throw new Error('Failed to add reaction');
      const data = await response.json();
      // Update local state or refetch post data
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12 pb-16">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header with back button and theme toggle */}
        <div className="flex justify-between items-center mb-8">
          <BackButton />
          <ThemeToggle />
        </div>
        
        <Card className="border-border dark:border-gray-800 shadow-sm">
          {/* Author Info Header */}
          <CardHeader className="gap-6" >
            <AuthorInfo />


             {/* Post Meta */}
             <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 opacity-70" />
                {formatDate(post.publish_date)}
              </span>

              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 opacity-70" />
                {readingTimeMinutes} {readingTimeMinutes === 1 ? 'minute' : 'minutes'} read
              </span>

              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 opacity-70" />
                {post.hours || 0} {post.hours === 1 ? 'hour' : 'hours'} shift
              </span>
            </div>


          </CardHeader>
          {/* Post Content */}
          <CardContent className="pb-8 -mt-8">

            
           

{/* Title */}
<h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 leading-tight mb-4">
              {post.title}
            </h1>

            {/* Tags */}
            <div className="flex flex-wrap gap-2.5 mb-10">
              {tags.map((tag, index) => (
                <Badge 
                  key={`${tag}-${index}`}
                  variant="secondary" 
                  className="text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            

            {/* Post Content */}
            <div className="prose dark:prose-invert max-w-none prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-img:rounded-lg prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-a:text-primary hover:prose-a:opacity-80">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

          </CardContent>

          {/* Reactions Section */}
          <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20">
            <div className="flex justify-center gap-4">
              <ReactionButton
                iconName="Heart"
                label="Love"
                count={post.reactions?.love || 0}
                postId={post.id}
                reactionType="love"
              />
              <ReactionButton
                iconName="Smile"
                label="Wow"
                count={post.reactions?.wow || 0}
                postId={post.id}
                reactionType="wow"
              />
              <ReactionButton
                iconName="Laugh"
                label="Haha"
                count={post.reactions?.haha || 0}
                postId={post.id}
                reactionType="haha"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <CardFooter className="flex justify-between items-center pt-5 pb-5 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <ShareButton />
              <BlogPostActions postId={post.id} />
            </div>
            <div>
              <Button asChild variant="outline" size="sm" className="text-sm">
                <Link href="/">
                  See more posts
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}