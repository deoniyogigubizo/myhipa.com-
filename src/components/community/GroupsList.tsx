'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IGroup, formatCount, groupTypeLabels } from '@/lib/community';

interface GroupsListProps {
  groups: IGroup[];
  onJoinGroup?: (groupId: string) => void;
}

export default function GroupsList({ groups, onJoinGroup }: GroupsListProps) {
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());

  const handleJoin = (groupId: string) => {
    setJoinedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
    onJoinGroup?.(groupId);
  };

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div 
          key={group._id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          {/* Group Cover */}
          <div className="relative h-32 bg-gradient-to-r from-hipa-primary to-hipa-secondary">
            {group.coverImage && (
              <Image
                src={group.coverImage}
                alt={group.name}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Group Icon/Avatar */}
            <div className="absolute -bottom-6 left-4">
              <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center text-2xl">
                {group.icon || '👥'}
              </div>
            </div>

            {/* Group Type Badge */}
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                {groupTypeLabels[group.type]}
              </span>
            </div>
          </div>

          {/* Group Info */}
          <div className="pt-8 pb-4 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/community/groups/${group.slug}`}
                  className="font-semibold text-lg text-gray-900 hover:text-hipa-primary transition-colors line-clamp-1"
                >
                  {group.name}
                </Link>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {group.description}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{formatCount(group.memberCount)} members</span>
              </div>
              {group.location && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{group.location.city}</span>
                </div>
              )}
            </div>

            {/* Rules Preview */}
            {group.rules && group.rules.length > 0 && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1 font-medium">Rules:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {group.rules.slice(0, 2).map((rule, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-hipa-primary">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                  {group.rules.length > 2 && (
                    <li className="text-hipa-primary text-xs">
                      +{group.rules.length - 2} more rules
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Join Button */}
            <div className="mt-4 flex gap-2">
              <Link 
                href={`/community/groups/${group.slug}`}
                className="flex-1 px-4 py-2 bg-hipa-primary text-white text-center rounded-lg font-medium hover:bg-hipa-secondary transition-colors"
              >
                View Group
              </Link>
              <button
                onClick={() => handleJoin(group._id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  joinedGroups.has(group._id)
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-hipa-primary text-white hover:bg-hipa-secondary'
                }`}
              >
                {joinedGroups.has(group._id) ? 'Joined' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
