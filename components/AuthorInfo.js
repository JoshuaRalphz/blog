'use client';

import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AuthorInfo() {
  const { user } = useUser();

  const author = {
    name: "Joshua Ralph Adrian Solomon",
    role: "Junior Developer at PasuyoPH",
    avatar:"/logo.png",
    workHours: "Mon-Fri, 8:00 AM - 5:00 PM"
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={author.avatar} alt={"/logo.png"} />
        <AvatarFallback>{author.name[0]}</AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium text-foreground">{author.name}</div>
        <div className="text-sm text-muted-foreground">{author.role}</div>
      </div>
    </div>
  );
} 