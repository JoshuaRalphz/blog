'use client';

import { useUser } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Heart, Smile, Laugh } from 'lucide-react';
import { Button, Badge, Tooltip } from 'antd';
import { HeartOutlined, SmileOutlined } from '@ant-design/icons';

// Proper mapping of all icon components
const iconComponents = {
  Heart: HeartOutlined,
  Smile: SmileOutlined,
  Laugh: Laugh
};

export default function ReactionButton({ postId, iconName, label, count, reactionType }) {
  const { isSignedIn, user } = useUser();
  const [isReacted, setIsReacted] = useState(false);
  const [currentCount, setCurrentCount] = useState(count);
  const [isLoading, setIsLoading] = useState(false);

  // Use the initial count from props
  useEffect(() => {
    setCurrentCount(count);
  }, [count]);

  // Enhanced color palette with more professional and cohesive colors
  const reactionColors = {
    love: {
      bg: '#FFF1F2',
      hoverBg: '#FFE4E6',
      text: '#E11D48',
      iconColor: '#F43F5E',
      border: '#FECDD3'
    },
    wow: {
      bg: '#F5F3FF',
      hoverBg: '#EDE9FE',
      text: '#7C3AED',
      iconColor: '#8B5CF6',
      border: '#DDD6FE'
    },
    haha: {
      bg: '#FEFCE8',
      hoverBg: '#FEF9C3',
      text: '#A16207',
      iconColor: '#CA8A04',
      border: '#FEF08A'
    }
  };

  const defaultColors = {
    bg: '#F5F5F5',
    hoverBg: '#E5E5E5',
    text: '#666666',
    iconColor: '#999999',
    border: '#E0E0E0'
  };

  const colors = reactionColors[reactionType] || defaultColors;

  // Check if current user has reacted
  useEffect(() => {
    const checkUserReaction = async () => {
      if (isSignedIn && user?.id) {
        try {
          const endpoint = '/api/reactions/check';

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              postId, 
              userId: user.id,
              reactionType
            }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const text = await response.text();
          if (!text) {
            throw new Error('Empty response from server');
          }

          const data = JSON.parse(text);
          if (!data || typeof data.hasReacted === 'undefined') {
            throw new Error('Invalid response format');
          }

          setIsReacted(data.hasReacted);
        } catch (error) {
          console.error('Error checking reaction:', error);
          toast.error('Failed to check reaction status');
        }
      } else {
        setIsReacted(false);
      }
    };

    checkUserReaction();
  }, [isSignedIn, user?.id, postId, reactionType]);

  const handleReaction = async () => {
    if (!isSignedIn || !user?.id) {
      toast.error('Please sign in to react');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const endpoint = '/api/reactions';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId, 
          userId: user.id,
          reactionType
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      if (!data || typeof data.hasReacted === 'undefined' || typeof data.count === 'undefined') {
        throw new Error('Invalid response format');
      }

      setIsReacted(data.hasReacted);
      setCurrentCount(data.count);
      toast.success(
        data.hasReacted 
          ? `You ${label.toLowerCase()}d this post!` 
          : `Removed your ${label.toLowerCase()} reaction!`
      );
    } catch (error) {
      console.error('Reaction error:', error);
      toast.error(error.message || 'Failed to process reaction');
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = iconComponents[iconName];

  return (
    <Tooltip title={isReacted ? `Remove ${label}` : `Add ${label}`} placement="top">
      <Badge 
        count={currentCount > 0 ? currentCount : null} 
        style={{ 
          backgroundColor: isReacted ? colors.bg : defaultColors.bg,
          color: isReacted ? colors.text : defaultColors.text,
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          border: `1px solid ${isReacted ? colors.border : defaultColors.border}`
        }}
        offset={[0, 2]}
      >
        <Button
          type="text"
          icon={<IconComponent 
            style={{ 
              color: isReacted ? colors.text : colors.iconColor,
              fontSize: '20px',
              transition: 'all 0.2s ease'
            }} 
          />}
          loading={isLoading}
          onClick={handleReaction}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: isReacted ? colors.bg : 'transparent',
            border: isReacted ? `1px solid ${colors.border}` : '1px solid transparent',
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
            boxShadow: isReacted ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isReacted ? colors.hoverBg : defaultColors.hoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isReacted ? colors.bg : 'transparent';
          }}
        >
          <span style={{
            fontSize: '13px',
            fontWeight: isReacted ? '600' : '500',
            color: isReacted ? colors.text : colors.iconColor,
            transition: 'all 0.2s ease'
          }}>
            {label}
          </span>
        </Button>
      </Badge>
    </Tooltip>
  );
}