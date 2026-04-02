'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostCard from '@/components/community/PostCard';
import CreatePost from '@/components/community/CreatePost';
import GroupsList from '@/components/community/GroupsList';
import QuestionsList from '@/components/community/QuestionsList';
import { IGroup, IPost, IQuestion, INotification } from '@/lib/community';
import NotificationPanel from '@/components/community/NotificationPanel';
import Leaderboard, { mockLeaderboardUsers } from '@/components/community/Leaderboard';
import { 
  postTypeLabels,
  groupTypeLabels 
} from '@/lib/community';

type TabType = 'feed' | 'groups' | 'questions' | 'leaderboard';



export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [posts, setPosts] = useState<IPost[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCommunityData();
  }, [activeTab]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'feed') {
        const res = await fetch('/api/community?type=feed&limit=20');
        const data = await res.json();
        if (data.success) {
          setPosts(data.data);
        }
      } else if (activeTab === 'groups') {
        const res = await fetch('/api/community?type=groups&limit=20');
        const data = await res.json();
        if (data.success) {
          setGroups(data.data);
        }
      } else if (activeTab === 'questions') {
        const res = await fetch('/api/community?type=questions&limit=20');
        const data = await res.json();
        if (data.success) {
          setQuestions(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load community data:', err);
      setError('Failed to connect to database. Please ensure MongoDB is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = (post: { type: unknown; content: string; tags: string[] }) => {
    console.log('Creating post:', post);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5dc' }}>
      <Navbar />
      
      {/* Hero Banner - Black background */}
      <div className="relative py-12 px-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#f5f5dc' }}>Welcome to Hipa Community</h1>
          <p className="text-lg" style={{ color: '#87ceeb' }}>
            Connect with buyers, sellers, and enthusiasts across Africa. Share deals, ask questions, and grow together.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#2d2d2d' }}>
              <span className="text-2xl">👥</span>
              <span className="font-medium" style={{ color: '#f5f5dc' }}>50K+ Members</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#2d2d2d' }}>
              <span className="text-2xl">📦</span>
              <span className="font-medium" style={{ color: '#f5f5dc' }}>100K+ Products</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#2d2d2d' }}>
              <span className="text-2xl">🏆</span>
              <span className="font-medium" style={{ color: '#f5f5dc' }}>500+ Active Groups</span>
            </div>
          </div>
        </div>
        {/* Skyblue accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: '#87ceeb' }} />
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Tab Navigation */}
              <div className="rounded-xl mb-6 p-1" style={{ backgroundColor: '#fffdd0', border: '1px solid #87ceeb' }}>
                <div className="flex overflow-x-auto">
                  {[
                    { id: 'feed', label: 'Feed', icon: '📰' },
                    { id: 'groups', label: 'Groups', icon: '👥' },
                    { id: 'questions', label: 'Q&A', icon: '❓' },
                    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className="flex-1 min-w-max px-6 py-3 font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: activeTab === tab.id ? '#1a1a1a' : 'transparent',
                        color: activeTab === tab.id ? '#f5f5dc' : '#2d2d2d',
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'feed' && (
                <div className="space-y-6">
                  {/* Create Post */}
                  <CreatePost onSubmit={handleCreatePost} />

                  {/* Feed Filters */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <button className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                      style={{ backgroundColor: '#1a1a1a', color: '#f5f5dc' }}>
                      All Posts
                    </button>
                    {Object.entries(postTypeLabels).slice(0, 4).map(([type, label]) => (
                      <button
                        key={type}
                        className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                        style={{ backgroundColor: '#fffdd0', color: '#1a1a1a', border: '1px solid #87ceeb' }}
                      >
                        {label as string}
                      </button>
                    ))}
                  </div>

                  {/* Loading/Error State */}
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full" style={{ backgroundColor: '#e5e5e5' }} />
                            <div className="flex-1">
                              <div className="h-4 rounded w-1/3 mb-2" style={{ backgroundColor: '#e5e5e5' }} />
                              <div className="h-3 rounded w-2/3" style={{ backgroundColor: '#e5e5e5' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-12 bg-white rounded-xl" style={{ border: '2px solid #87ceeb' }}>
                      <p className="text-lg" style={{ color: '#1a1a1a' }}>{error}</p>
                      <button 
                        onClick={loadCommunityData}
                        className="mt-4 px-6 py-2 rounded-lg font-medium text-white"
                        style={{ backgroundColor: '#1a1a1a' }}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl" style={{ border: '2px solid #87ceeb' }}>
                      <p className="text-lg" style={{ color: '#1a1a1a' }}>No posts yet</p>
                      <p className="mt-2" style={{ color: '#5bbce4' }}>Be the first to share something!</p>
                    </div>
                  ) : (
                    /* Posts */
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <PostCard key={post._id} post={post as never} />
                      ))}
                    </div>
                  )}

                  {/* Load More */}
                  <div className="text-center py-8">
                    <button className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Load More Posts
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="space-y-6">
                  {/* Groups Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Community Groups</h2>
                      <p className="text-gray-500">Join groups that match your interests</p>
                    </div>
                    <button className="px-4 py-2 bg-hipa-primary text-white rounded-lg font-medium hover:bg-hipa-secondary">
                      + Create Group
                    </button>
                  </div>

                  {/* Group Type Filters */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(groupTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Groups List */}
                  <GroupsList groups={groups} />

                  {/* Load More */}
                  <div className="text-center py-8">
                    <button className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Browse All Groups
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="space-y-6">
                  {/* Questions Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Q&A Community</h2>
                      <p className="text-gray-500">Ask questions and get answers from the community</p>
                    </div>
                    <button className="px-4 py-2 bg-hipa-primary text-white rounded-lg font-medium hover:bg-hipa-secondary">
                      Ask a Question
                    </button>
                  </div>

                  {/* Question Filters */}
                  <div className="flex flex-wrap gap-2">
                    <button className="px-4 py-2 bg-hipa-primary text-white rounded-full text-sm font-medium">
                      All Questions
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50">
                      Unanswered
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50">
                      My Questions
                    </button>
                  </div>

                  {/* Questions List */}
                  <QuestionsList questions={questions} />
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  <Leaderboard 
                    users={mockLeaderboardUsers} 
                    period={leaderboardPeriod}
                    onPeriodChange={setLeaderboardPeriod}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Notifications Panel */}
              <NotificationPanel 
                notifications={notifications}
                onMarkAllRead={() => console.log('Mark all read')}
              />

              {/* Trending Tags */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">🔥 Trending Now</h3>
                <div className="flex flex-wrap gap-2">
                  {['iPhone 16', 'Samsung S24', 'MacBook', 'Laptops', 'Wireless Earbuds', 'African Fashion', 'Handmade'].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-hipa-primary/10 to-hipa-secondary/10 rounded-xl p-4 border border-hipa-primary/20">
                <h3 className="font-semibold text-gray-900 mb-4">📊 Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active Members</span>
                    <span className="font-semibold text-gray-900">50,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Posts Today</span>
                    <span className="font-semibold text-gray-900">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Questions Answered</span>
                    <span className="font-semibold text-gray-900">89%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg Response Time</span>
                    <span className="font-semibold text-gray-900">&lt; 2 hours</span>
                  </div>
                </div>
              </div>

              {/* Community Guidelines */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Community Guidelines</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-hipa-primary">✓</span>
                    <span>Be respectful and supportive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-hipa-primary">✓</span>
                    <span>No spam or self-promotion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-hipa-primary">✓</span>
                    <span>Verify before buying</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-hipa-primary">✓</span>
                    <span>Report suspicious content</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
