'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserLevel, getLevelBadge, getLevelColor, formatCount } from '@/lib/community';

interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  level: UserLevel;
  points: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  period: 'weekly' | 'monthly' | 'all_time';
  onPeriodChange?: (period: 'weekly' | 'monthly' | 'all_time') => void;
}

export default function Leaderboard({ users, period, onPeriodChange }: LeaderboardProps) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-50 border-yellow-200';
      case 2: return 'bg-gray-50 border-gray-200';
      case 3: return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">🏆 Leaderboard</h3>
          
          {/* Period Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['weekly', 'monthly', 'all_time'] as const).map(p => (
              <button
                key={p}
                onClick={() => onPeriodChange?.(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="px-4 py-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-end justify-center gap-4">
          {/* 2nd Place */}
          {users[1] && (
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 mx-auto ring-4 ring-gray-200">
                  {users[1].avatar ? (
                    <Image src={users[1].avatar} alt={users[1].name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold text-xl">
                      {users[1].name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">🥈</span>
              </div>
              <p className="mt-3 font-medium text-gray-900 text-sm truncate max-w-20">{users[1].name}</p>
              <p className="text-xs text-gray-500">{formatCount(users[1].points)} pts</p>
            </div>
          )}

          {/* 1st Place */}
          {users[0] && (
            <div className="text-center -mt-2">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 mx-auto ring-4 ring-yellow-400">
                  {users[0].avatar ? (
                    <Image src={users[0].avatar} alt={users[0].name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-2xl">
                      {users[0].name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-3xl">🥇</span>
              </div>
              <p className="mt-3 font-semibold text-gray-900 text-sm truncate max-w-24">{users[0].name}</p>
              <p className="text-xs text-yellow-600 font-medium">{formatCount(users[0].points)} pts</p>
            </div>
          )}

          {/* 3rd Place */}
          {users[2] && (
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 mx-auto ring-4 ring-orange-200">
                  {users[2].avatar ? (
                    <Image src={users[2].avatar} alt={users[2].name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-xl">
                      {users[2].name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">🥉</span>
              </div>
              <p className="mt-3 font-medium text-gray-900 text-sm truncate max-w-20">{users[2].name}</p>
              <p className="text-xs text-gray-500">{formatCount(users[2].points)} pts</p>
            </div>
          )}
        </div>
      </div>

      {/* Rest of Leaderboard */}
      <div className="border-t border-gray-100">
        {users.slice(3).map((user, index) => (
          <Link
            key={user.userId}
            href={`/profile/${user.userId}`}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
              user.isCurrentUser ? 'bg-hipa-primary/5' : ''
            }`}
          >
            <span className="w-6 text-center text-sm font-medium text-gray-500">
              {user.rank}
            </span>

            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-hipa-primary to-hipa-secondary text-white font-semibold">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                {user.isCurrentUser && (
                  <span className="text-xs text-hipa-primary">(You)</span>
                )}
              </div>
              <p className={`text-xs ${getLevelColor(user.level)}`}>
                {getLevelBadge(user.level)} {user.level.replace('_', ' ')}
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCount(user.points)}</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      {users.length > 10 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <Link
            href="/leaderboard"
            className="block text-center text-sm text-hipa-primary hover:text-hipa-secondary transition-colors font-medium"
          >
            View full leaderboard →
          </Link>
        </div>
      )}
    </div>
  );
}

// Mock data for development
export const mockLeaderboardUsers: LeaderboardUser[] = [
  { rank: 1, userId: 'u1', name: 'Marie Uwase', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', level: 'hipa_pro', points: 12500 },
  { rank: 2, userId: 'u2', name: 'Jean-Pierre Muhire', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', level: 'hipa_pro', points: 9800 },
  { rank: 3, userId: 'u3', name: 'Fatou Diallo', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', level: 'community_leader', points: 8750 },
  { rank: 4, userId: 'u4', name: 'Emmanuel Osei', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', level: 'community_leader', points: 7200 },
  { rank: 5, userId: 'u5', name: 'Grace Mukamana', level: 'trusted_contributor', points: 5800 },
  { rank: 6, userId: 'u6', name: 'Patrick Nkusi', level: 'trusted_contributor', points: 4500 },
  { rank: 7, userId: 'u7', name: 'Sarah Umutoni', level: 'trusted_contributor', points: 3200 },
  { rank: 8, userId: 'u8', name: 'David Habimana', level: 'active_member', points: 2100 },
  { rank: 9, userId: 'u9', name: 'Alice Ingabire', level: 'active_member', points: 1500 },
  { rank: 10, userId: 'u10', name: 'Robert Kayumba', level: 'active_member', points: 890 },
];
