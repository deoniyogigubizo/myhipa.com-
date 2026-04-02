'use client';

import { useState } from 'react';
import { PostType, postTypeLabels } from '@/lib/community';

interface CreatePostProps {
  onSubmit?: (post: { type: PostType; content: string; tags: string[] }) => void;
}

const postTypes: { type: PostType; icon: string; description: string }[] = [
  { type: 'product_share', icon: '📦', description: 'Share a product you\'re selling' },
  { type: 'review_post', icon: '⭐', description: 'Write a review about a product' },
  { type: 'question', icon: '❓', description: 'Ask the community a question' },
  { type: 'deal_alert', icon: '⚡', description: 'Share a limited-time deal' },
  { type: 'community_update', icon: '📢', description: 'Share an update or thought' },
];

export default function CreatePost({ onSubmit }: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType>('community_update');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    
    const tagList = tags
      .split(',')
      .map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter(tag => tag.length > 0);

    onSubmit?.({
      type: selectedType,
      content: content.trim(),
      tags: tagList,
    });

    // Reset form
    setContent('');
    setTags('');
    setIsOpen(false);
    setIsSubmitting(false);
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 p-3 text-left text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hipa-primary to-hipa-secondary flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span>What's on your mind? Share with the community...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Create Post</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Post Type Selector */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm text-gray-500 mb-2">Select post type:</p>
        <div className="flex flex-wrap gap-2">
          {postTypes.map(({ type, icon, description }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedType === type
                  ? 'bg-hipa-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={description}
            >
              {icon} {postTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Content Input */}
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            selectedType === 'question'
              ? 'What would you like to ask the community?'
              : selectedType === 'deal_alert'
              ? 'Describe your deal (price, duration, discount code...)'
              : selectedType === 'product_share'
              ? 'Tell people about what you\'re selling...'
              : 'Share your thoughts with the community...'
          }
          className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-hipa-primary/20 focus:border-hipa-primary"
        />

        {/* Tags Input */}
        <div className="mt-3">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags (comma separated, e.g., rwanda, fashion, handmade)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hipa-primary/20 focus:border-hipa-primary"
          />
        </div>

        {/* Character Count */}
        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <span>{content.length} / 2000 characters</span>
          {content.length > 1900 && (
            <span className="text-yellow-600">Approaching limit</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        {/* Media Upload */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-hipa-primary hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-hipa-primary hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-hipa-primary hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            content.trim() && !isSubmitting
              ? 'bg-hipa-primary text-white hover:bg-hipa-secondary'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
