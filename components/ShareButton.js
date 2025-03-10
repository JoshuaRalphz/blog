'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ShareButton() {
  const handleShare = () => {
    try {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!', {
        duration: 3000,
        position: 'bottom-right',
        style: {
          maxWidth: '300px',
          padding: '12px',
          borderRadius: '8px',
        },
      });
    } catch (error) {
      toast.error('Failed to copy link', {
        duration: 3000,
        position: 'bottom-right',
        style: {
          maxWidth: '300px',
          padding: '12px',
          borderRadius: '8px',
        },
      });
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground"
      onClick={handleShare}
    >
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
} 