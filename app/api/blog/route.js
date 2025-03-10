import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthData } from '@/utils/clerkAuth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
);

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  description: z.string().optional(),
  hours: z.number().min(0),
  tags: z.array(z.string()),
  publish_date: z.string().datetime()
});

// Format tags properly
const formatTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags;
  }
  
  try {
    if (typeof tags === 'string') {
      // Handle JSON strings
      if (tags.startsWith('[') && tags.endsWith(']')) {
        return JSON.parse(tags);
      }
      // Handle JSON-like strings
      if (tags.startsWith('{') && tags.endsWith('}')) {
        return JSON.parse(tags.replace(/^\{/, '[').replace(/\}$/, ']'));
      }
      // Handle comma-separated strings
      return tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
  } catch (error) {
    console.error('Error formatting tags:', error);
  }
  
  return [];
};

export async function POST(request) {
  try {
    // Verify Supabase client
    if (!supabase) {
      return NextResponse.json({ 
        error: {
          message: 'Internal server error - failed to initialize database connection',
          code: 'DB_INIT_ERROR'
        } 
      }, { status: 500 });
    }

    // Validate request
    const { clerkUserId } = await getAuthData(request);
    if (!clerkUserId) {
      return NextResponse.json({ 
        error: {
          message: 'Unauthorized - Please sign in',
          code: 'UNAUTHORIZED'
        } 
      }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = postSchema.parse(body);

    // Format tags properly
    const formattedTags = formatTags(validatedData.tags);

    // Determine post status
    const publishDate = new Date(validatedData.publish_date);
    const now = new Date();
    const status = publishDate > now ? 'scheduled' : 'published';

    // Insert into Supabase
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        user_id: clerkUserId,
        title: validatedData.title,
        content: validatedData.content,
        hours: validatedData.hours,
        tags: formattedTags,
        publish_date: validatedData.publish_date,
        status: status,
        published_at: status === 'published' ? new Date().toISOString() : publishDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to create post - no data returned');

    // Return success response
    return NextResponse.json({ 
      data: {
        id: data[0].id,
        status: data[0].status,
        publish_date: data[0].publish_date,
        published_at: data[0].published_at
      } 
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ 
      error: {
        message: error.message,
        code: 'SERVER_ERROR'
      } 
    }, { status: 500 });
  }
} 