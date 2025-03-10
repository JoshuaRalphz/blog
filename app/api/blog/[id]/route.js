import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuthData } from '@/utils/clerkAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch post
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: { message: 'Post not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json(
      { 
        error: {
          message: error.message || 'Failed to fetch post',
          code: 'SERVER_ERROR'
        } 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Get authenticated user
    const { clerkUserId } = await getAuthData(request);
    
    // Check if post exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    // If post doesn't exist, return 404
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Remove id from the update payload to prevent updating the primary key
    const { id: _, ...updateData } = body;

    // Determine new status based on publish date
    const publishDate = new Date(updateData.publish_date || existingPost.publish_date);
    const now = new Date();
    const status = publishDate > now ? 'scheduled' : 'published';

    // Update existing post
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        ...updateData,
        status: status,
        published_at: status === 'published' ? new Date().toISOString() : publishDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT route:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { clerkUserId } = await getAuthData(request);

    // First, get the post data before deleting
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Then delete the post
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', clerkUserId);

    if (error) throw error;

    // Return the deleted post data
    return NextResponse.json({ 
      success: true,
      deletedPost: existingPost 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ 
      error: {
        message: error.message,
        code: 'SERVER_ERROR'
      } 
    }, { status: 500 });
  }
} 