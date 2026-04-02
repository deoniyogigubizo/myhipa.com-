'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IPost, getTimeAgo, formatCount, getLevelBadge, postTypeLabels } from '@/lib/community';

interface PostCardProps {
  post: IPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
}

export default function PostCard({ post, onLike, onComment, onShare, onSave }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.engagement.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(post._id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(post._id);
  };

  const getTypeIcon = () => {
    switch (post.type) {
      case 'product_share': return '📦';
      case 'review_post': return '⭐';
      case 'question': return '❓';
      case 'deal_alert': return '⚡';
      case 'community_update': return '📢';
      case 'ama_question': return '🎤';
      default: return '📝';
    }
  };

  const getTypeColor = () => {
    switch (post.type) {
      case 'product_share': return 'bg-blue-100 text-blue-700';
      case 'review_post': return 'bg-yellow-100 text-yellow-700';
      case 'question': return 'bg-purple-100 text-purple-700';
      case 'deal_alert': return 'bg-red-100 text-red-700';
      case 'community_update': return 'bg-green-100 text-green-700';
      case 'ama_question': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Post Header */}
      <div className="p-4 flex items-start gap-3">
        {/* Author Avatar */}
        <Link href={`/profile/${post.author.userId}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 relative">
            {post.author.avatar ? (
              <Image 
                src={post.author.avatar} 
                alt={post.author.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-hipa-primary to-hipa-secondary text-white font-semibold">
                {post.author.name.charAt(0)}
              </div>
            )}
          </div>
        </Link>

        {/* Author Info & Post Type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              href={`/profile/${post.author.userId}`}
              className="font-semibold text-gray-900 hover:text-hipa-primary transition-colors"
            >
              {post.author.name}
            </Link>
            {post.author.isVerified && (
              <span className="text-blue-500" title="Verified Seller">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            <span className="text-gray-400 text-sm">{getTimeAgo(post.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor()}`}>
              {getTypeIcon()} {postTypeLabels[post.type]}
            </span>
            {post.author.level !== 'newcomer' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                {getLevelBadge(post.author.level)} {post.author.level.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Save/More Actions */}
        <button 
          onClick={handleSave}
          className={`p-2 rounded-full transition-colors ${isSaved ? 'text-hipa-primary bg-hipa-primary/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          title={isSaved ? 'Saved' : 'Save post'}
        >
          <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content.text}</p>
        
        {/* Media Content */}
        {post.content.media && post.content.media.length > 0 && (
          <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: post.content.media.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}>
            {post.content.media.slice(0, 4).map((media, index) => (
              <div 
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={media.url}
                  alt={`Media ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {media.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Product Snapshot */}
        {post.content.productSnapshot && (
          <Link 
            href={`/product/${post.content.productSnapshot.slug}`}
            className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            {post.content.productSnapshot.image && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white relative flex-shrink-0">
                <Image
                  src={post.content.productSnapshot.image}
                  alt={post.content.productSnapshot.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {post.content.productSnapshot.title}
              </p>
              <p className="text-hipa-primary font-semibold">
                RWF {post.content.productSnapshot.price.toLocaleString()}
              </p>
            </div>
            <span className="px-3 py-1 bg-hipa-primary text-white text-sm rounded-full">
              View
            </span>
          </Link>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.slice(0, 5).map(tag => (
              <Link 
                key={tag}
                href={`/search?tag=${tag}`}
                className="text-xs text-hipa-primary hover:text-hipa-secondary"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium">{formatCount(likeCount)}</span>
          </button>

          {/* Comment Button */}
          <button 
            onClick={() => onComment?.(post._id)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-hipa-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium">{formatCount(post.engagement.comments)}</span>
          </button>

          {/* Share Button */}
          <button 
            onClick={() => onShare?.(post._id)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-sm font-medium">{formatCount(post.engagement.shares)}</span>
          </button>
        </div>

        {/* Boosted Badge */}
        {post.boosted && (
          <div className="flex items-center gap-1 text-hipa-primary">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Boosted</span>
          </div>
        )}
      </div>
    </div>
  );
}
