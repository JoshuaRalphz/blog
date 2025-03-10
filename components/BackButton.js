'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  return (
    <Button asChild variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-primary">
      <Link href="/" className="flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all posts
      </Link>
    </Button>
  );
} 