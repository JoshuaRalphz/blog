import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Calendar, MoreVertical, Edit, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import BlogPostActions from '@/components/BlogPostActions';

// Add this helper function to calculate reading time
const calculateReadingTime = (content) => {
  // Strip HTML tags to get just the text
  const text = content.replace(/<[^>]*>?/gm, '');
  // Count words (approximately)
  const wordCount = text.split(/\s+/).length;
  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(wordCount / 200);
  return minutes < 1 ? 1 : minutes;
};

export default function BlogCard({ post, onDelete }) {
  const router = useRouter();
  
  // Calculate reading time
  const readingTime = calculateReadingTime(post.content);

  // More robust tag parsing with error handling
  const parseTags = (tags) => {
    try {
      if (!tags) return [];
      
      if (typeof tags === 'string') {
        // Handle PostgreSQL array format or JSON string
        if (tags.startsWith('{') && tags.endsWith('}')) {
          const cleaned = tags.replace(/^\{|\}$/g, '')
            .split(',')
            .map(tag => tag.trim().replace(/^"|"$/g, ''));
          return cleaned.filter(Boolean);
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

  // Get excerpt with proper handling
  const getExcerpt = (text, maxLength = 160) => {
    if (!text) return '';
    
    // Clean the text of any HTML
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    if (cleanText.length <= maxLength) return cleanText;
    
    const sentences = cleanText.split(/([.!?])\s+/);
    let excerpt = '';
    let count = 0;
    
    for (let i = 0; i < sentences.length; i += 2) {
      if (i + 1 < sentences.length) {
        const sentence = sentences[i] + (sentences[i + 1] || '');
        if (excerpt.length + sentence.length > maxLength) break;
        excerpt += sentence + ' ';
        count++;
        if (count >= 4) break;
      }
    }
    
    return excerpt.trim() || cleanText.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Date unavailable';
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/blog/${post.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete post');
      
      toast.success('Post deleted successfully');
      // Call the parent's delete handler
      onDelete(post.id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="overflow-hidden border-border dark:border-gray-700 transition-all duration-300 group hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/5">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-[33px] font-semibold tracking-tight group-hover:text-primary transition-colors duration-200">
            {post.title}
          </CardTitle>
          
          <div className="flex items-center gap-4">
            
            {post.status === 'scheduled' ? (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(post.published_at), 'MMM d, yyyy')}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1 opacity-70" />
                
                {formatDate(post.publish_date)}
              </span>
            )}<Badge 
            variant="outline" 
            className="text-xs flex items-center gap-1 ml-auto sm:ml-0 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 border-blue-100 dark:border-blue-800"
          >
            <Clock className="h-3 w-3" />
            {readingTime} {readingTime === 1 ? 'minute' : 'minutes'} read
          </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-4">
        <p className="text-muted-foreground leading-relaxed text-md line-clamp-3">
          {getExcerpt(post.content)}
        </p>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-3 border-t border-border/40 dark:border-gray-700/40">
        <div className="flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            tags.slice(0, 6).map((tag, index) => (
              <Badge 
                key={`${tag}-${index}`}
                variant="secondary" 
                className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                {tag}
              </Badge>
            ))
          ) : null}
          
          {tags.length > 6 ? (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 6} more
            </Badge>
          ) : null}
          

        </div>
        
        <Button 
          asChild 
          size="sm" 
          variant="ghost" 
          className="group self-end px-3 py-1 h-8 hover:bg-primary/10 hover:text-primary transition-all"
        >
          <Link href={`/blog/${post.id}`} className="flex items-center gap-1 text-sm font-medium">
            Read more
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
      <CardFooter className="flex justify-between">
        <BlogPostActions postId={post.id} postUserId={post.user_id} />
      </CardFooter>
    </Card>
  );
}