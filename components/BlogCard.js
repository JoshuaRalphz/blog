import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import BlogPostActions from '@/components/BlogPostActions';

// Add this helper function to calculate word count
const calculateWordCount = (content) => {
  // Strip HTML tags to get just the text
  const text = content.replace(/<[^>]*>?/gm, '');
  // Count words (approximately)
  return text.split(/\s+/).filter(Boolean).length;
};

export default function BlogCard({ post, onDelete }) {
  const router = useRouter();
  
  // Calculate word count
  const wordCount = calculateWordCount(post.content);

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
      if (!dateString) return 'Not yet published'; // Handle null dates
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Date unavailable';
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <Card className="overflow-hidden border-border dark:border-gray-700 transition-all duration-300 group hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/5">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <CardTitle className="text-2xl md:text-[33px] font-semibold tracking-tight group-hover:text-primary transition-colors duration-200">
            {post.title}
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {post.status === 'scheduled' ? (
              <Badge variant="outline" className="w-full sm:w-auto border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-300 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(post.publish_date)}
              </Badge>
            ) : (
              <Badge variant="outline" className="w-full sm:w-auto border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-300 text-xs">
                <Calendar className="h-3 w-3 mr-1 opacity-70" />
                {formatDate(post.published_at || post.publish_date)}
              </Badge>
            )}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Badge 
                variant="outline" 
                className="w-full sm:w-auto text-xs flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 border-blue-100 dark:border-blue-800"
              >
                <FileText className="h-3 w-3" />
                {wordCount} words
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-4">
        <p className="text-muted-foreground leading-relaxed text-sm md:text-md line-clamp-3">
          {getExcerpt(post.content)}
        </p>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-3 border-t border-border/40 dark:border-gray-700/40">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
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
          className="group self-end px-3 py-1 h-8 hover:bg-primary/10 hover:text-primary transition-all w-full sm:w-auto mt-2 sm:mt-0"
        >
          <Link href={`/blog/${post.id}`} className="flex items-center gap-1 text-sm font-medium justify-center sm:justify-start">
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