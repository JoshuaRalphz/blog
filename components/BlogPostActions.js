'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function BlogPostActions({ postId, postUserId }) {
  const router = useRouter();
  const { user } = useUser();

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/blog/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete post');
      
      toast.success('Post deleted successfully!');
      router.push('/');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Only show actions if the current user is the author
  if (user?.id !== process.env.NEXT_PUBLIC_AUTHOR_USER_ID) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => router.push(`/blog/${postId}/edit`)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
        onClick={handleDelete}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
} 