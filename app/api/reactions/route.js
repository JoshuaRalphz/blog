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

    // Check if reaction exists
    const { data: existingReaction, error: fetchError } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let hasReacted = false;
    
    if (existingReaction) {
      // Remove reaction
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) throw deleteError;
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from('reactions')
        .insert({
          post_id: postId,
          user_id: userId,
          reaction_type: reactionType
        });

      if (insertError) throw insertError;
      hasReacted = true;
    }

    // Get updated reaction count
    const { count } = await supabase
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('reaction_type', reactionType);

    return NextResponse.json({
      hasReacted,
      count
    }, { status: 200 });

  } catch (error) {
    console.error('Error in reactions API:', error);
    return NextResponse.json(
      { 
        error: {
          message: error.message || 'Failed to process reaction',
          code: 'SERVER_ERROR'
        } 
      },
      { status: 500 }
    );
  }
}
