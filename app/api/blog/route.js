import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthData } from '@/utils/clerkAuth';
import { postSchema } from '@/lib/schemas';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Format tags properly
const formatTags = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return tags.split(',').map(tag => tag.trim());
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

    // Get authenticated user
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
    const validatedData = postSchema.parse({
      ...body,
      hours: Number(body.hours),
      publish_date: new Date(body.publish_date).toISOString()
    });

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
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { 
        error: {
          message: error.message || 'Failed to create blog post',
          code: 'SERVER_ERROR'
        } 
      }, 
      { status: 500 }
    );
  }
} 