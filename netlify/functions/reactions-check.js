import { createClient } from '@supabase/supabase-js';
const rateLimit = require('lambda-rate-limiter')({
  interval: 60 * 1000 // 1 minute
}).check;

exports.handler = async function(event, context) {
  try {
    // Rate limiting
    await rateLimit(10, event.headers['x-forwarded-for'] || event.ip);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Parse request body
    const { postId, userId } = JSON.parse(event.body);

    if (!postId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'postId and userId are required' })
      };
    }

    // Check for existing reaction
    const { data, error } = await supabase
      .from('blog_reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        hasReacted: data.length > 0,
        reactions: data 
      })
    };
  } catch (error) {
    if (error.message === 'Rate limit exceeded') {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Too many requests' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message 
      })
    };
  }
} 