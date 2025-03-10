import { useUser } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';

export default function CommentForm({ postId }) {
  const { isSignedIn, user } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      toast.error('Please sign in to comment');
      return;
    }

    const formData = new FormData(e.target);
    const content = formData.get('content');

    // Submit comment to API
    await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ postId, content }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        name="content"
        className="w-full p-4 border rounded-lg"
        placeholder="Write a comment..."
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Post Comment
      </button>
    </form>
  );
} 