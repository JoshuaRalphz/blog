import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { postId, userId, reactionType } = await request.json();

    if (!postId || !userId || !reactionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has reacted
    const { data: reaction, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      hasReacted: !!reaction
    }, { status: 200 });

  } catch (error) {
    console.error('Error in reactions check API:', error);
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