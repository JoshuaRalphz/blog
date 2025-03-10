import { NextResponse } from 'next/server';
import { getAuthData } from '@/utils/clerkAuth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    // Get authenticated user
    const { clerkUserId } = await getAuthData(request);
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const reactionType = searchParams.get('reactionType');

    if (!postId || !reactionType) {
      return NextResponse.json(
        { error: 'postId and reactionType are required' },
        { status: 400 }
      );
    }

    // Check if user has reacted
    const { data, error } = await supabase
      .from('blog_reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', clerkUserId)
      .eq('reaction_type', reactionType);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({ 
      hasReacted: data && data.length > 0 
    }, { status: 200 });
  } catch (error) {
    console.error('Error in reactions check route:', error);
    return NextResponse.json(
      { 
        error: {
          message: error.message || 'Failed to check reaction',
          code: 'SERVER_ERROR'
        } 
      },
      { status: 500 }
    );
  }
} 