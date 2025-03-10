import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'lambda-rate-limiter';

const limiter = rateLimit({
  interval: 60 * 1000 // 1 minute
}).check;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.ip;
    await limiter(10, ip);

    const { postId, userId, reactionType } = await request.json();

    if (!postId || !userId || !reactionType) {
      return NextResponse.json(
        { error: 'postId, userId, and reactionType are required' },
        { status: 400 }
      );
    }

    // Check for existing reaction
    const { data: existingReaction, error: checkError } = await supabase
      .from('blog_reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType)
      .single();

    let countChange = 0;
    let hasReacted = false;
    
    if (existingReaction) {
      // Remove reaction
      const { error: deleteError } = await supabase
        .from('blog_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) throw deleteError;
      countChange = -1;
      hasReacted = false;
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from('blog_reactions')
        .insert([{
          post_id: postId,
          user_id: userId,
          reaction_type: reactionType
        }]);

      if (insertError) throw insertError;
      countChange = 1;
      hasReacted = true;
    }

    // Update post reaction count
    const { data: post, error: getError } = await supabase
      .from('blog_posts')
      .select('reactions')
      .eq('id', postId)
      .single();

    if (getError) throw getError;

    const currentReactions = post.reactions || {};
    currentReactions[reactionType] = (currentReactions[reactionType] || 0) + countChange;

    // Update the post with new reaction counts
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ reactions: currentReactions })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json(
      { 
        success: true,
        hasReacted,
        count: currentReactions[reactionType],
        reactions: currentReactions
      },
      { status: 200 }
    );
  } catch (error) {
    if (error.message === 'Rate limit exceeded') {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to process reaction' },
      { status: 500 }
    );
  }
} 