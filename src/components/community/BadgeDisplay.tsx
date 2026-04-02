'use client';

import { useState } from 'react';

interface Badge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earnedAt?: Date;
  progress?: number;
  target?: number;
}

// Sample badges data
const allBadges: Badge[] = [
  { badgeId: 'first_post', name: 'First Post', description: 'Create your first post', icon: '📝', category: 'engagement', tier: 'bronze' },
  { badgeId: 'active_member', name: 'Active Member', description: 'Post 10 times', icon: '⭐', category: 'engagement', tier: 'silver' },
  { badgeId: 'prolific_poster', name: 'Prolific Poster', description: 'Post 50 times', icon: '🌟', category: 'engagement', tier: 'gold' },
  { badgeId: 'first_sale', name: 'First Sale', description: 'Complete your first sale', icon: '💰', category: 'sales', tier: 'bronze' },
  { badgeId: 'top_seller', name: 'Top Seller', description: 'Complete 100 sales', icon: '🏆', category: 'sales', tier: 'diamond' },
  { badgeId: 'helpful', name: 'Helpful', description: 'Have 10 answers marked as helpful', icon: '✅', category: 'contribution', tier: 'silver' },
  { badgeId: 'mentor', name: 'Community Mentor', description: 'Answer 50 questions', icon: '🎓', category: 'contribution', tier: 'gold' },
  { badgeId: 'verified', name: 'Verified User', description: 'Complete KYC verification', icon: '✓', category: 'trust', tier: 'bronze' },
  { badgeId: 'trusted_seller', name: 'Trusted Seller', description: 'Maintain 4.5+ rating for 100 orders', icon: '💎', category: 'trust', tier: 'diamond' },
  { badgeId: 'streak_7', name: 'Week Warrior', description: '7-day activity streak', icon: '🔥', category: 'milestone', tier: 'bronze' },
  { badgeId: 'streak_30', name: 'Monthly Champion', description: '30-day activity streak', icon: '⚡', category: 'milestone', tier: 'gold' },
  { badgeId: 'early_adopter', name: 'Early Adopter', description: 'Joined during beta', icon: '🚀', category: 'special', tier: 'diamond' },
];

interface BadgeDisplayProps {
  userBadges?: string[];
  userPoints?: number;
}

export default function BadgeDisplay({ userBadges = ['first_post', 'active_member', 'verified', 'streak_7'], userPoints = 1250 }: BadgeDisplayProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const earnedBadges = allBadges.filter(b => userBadges.includes(b.badgeId));
  const unearnedBadges = allBadges.filter(b => !userBadges.includes(b.badgeId));

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-800 border-amber-400';
      case 'silver': return 'from-gray-300 to-gray-500 border-gray-400';
      case 'gold': return 'from-yellow-400 to-yellow-600 border-yellow-500';
      case 'platinum': return 'from-violet-400 to-violet-600 border-violet-500';
      case 'diamond': return 'from-cyan-400 to-blue-600 border-cyan-500';
      default: return 'from-gray-400 to-gray-600 border-gray-500';
    }
  };

  const getTierGlow = (tier: string) => {
    switch (tier) {
      case 'gold': return 'shadow-yellow-400/50';
      case 'platinum': return 'shadow-violet-400/50';
      case 'diamond': return 'shadow-cyan-400/50';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">🏅 Your Badges ({earnedBadges.length})</h3>
        <div className="flex flex-wrap gap-3">
          {earnedBadges.map(badge => (
            <button
              key={badge.badgeId}
              onClick={() => setSelectedBadge(badge)}
              className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${getTierColor(badge.tier)} border-2 flex items-center justify-center text-2xl shadow-lg ${getTierGlow(badge.tier)} hover:scale-110 transition-transform`}
              title={badge.name}
            >
              {badge.icon}
            </button>
          ))}
          {earnedBadges.length === 0 && (
            <p className="text-gray-500 text-sm py-4">No badges earned yet. Start engaging to earn badges!</p>
          )}
        </div>
      </div>

      {/* Progress to Next Badges */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">🎯 In Progress</h3>
        <div className="space-y-3">
          {unearnedBadges.slice(0, 3).map(badge => {
            const progress = Math.floor(Math.random() * 80) + 10; // Mock progress
            return (
              <button
                key={badge.badgeId}
                onClick={() => setSelectedBadge(badge)}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-hipa-primary/50 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTierColor(badge.tier)} flex items-center justify-center text-lg opacity-50`}>
                  {badge.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">{badge.name}</span>
                    <span className="text-xs text-gray-500">{progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-hipa-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBadge(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${getTierColor(selectedBadge.tier)} border-4 flex items-center justify-center text-5xl shadow-2xl ${getTierGlow(selectedBadge.tier)} mb-4`}>
                {selectedBadge.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{selectedBadge.name}</h3>
              <p className="text-gray-500 mt-1">{selectedBadge.description}</p>
              
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getTierColor(selectedBadge.tier)} text-white`}>
                  {selectedBadge.tier.charAt(0).toUpperCase() + selectedBadge.tier.slice(1)}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 capitalize">
                  {selectedBadge.category}
                </span>
              </div>

              {userBadges.includes(selectedBadge.badgeId) ? (
                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-700 font-medium">✓ Badge Earned!</p>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-hipa-primary rounded-full"
                      style={{ width: `${Math.floor(Math.random() * 80) + 10}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Keep going to earn this badge!</p>
                </div>
              )}

              <button
                onClick={() => setSelectedBadge(null)}
                className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
