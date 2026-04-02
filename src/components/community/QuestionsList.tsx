'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IQuestion, getTimeAgo, formatCount } from '@/lib/community';

interface QuestionsListProps {
  questions: IQuestion[];
  onAnswer?: (questionId: string) => void;
  onUpvote?: (questionId: string) => void;
}

export default function QuestionsList({ questions, onAnswer, onUpvote }: QuestionsListProps) {
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set());

  const handleUpvote = (questionId: string) => {
    setVotedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
    onUpvote?.(questionId);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">No questions yet</h3>
        <p className="text-gray-500 mt-1">Be the first to ask!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map(question => {
        const hasAcceptedAnswer = question.answers.some(a => a.isAcceptedAnswer);
        
        return (
          <div
            key={question._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Vote Section */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleUpvote(question._id)}
                  className={`p-1 rounded-lg transition-colors ${
                    votedQuestions.has(question._id)
                      ? 'text-hipa-primary bg-hipa-primary/10'
                      : 'text-gray-400 hover:text-hipa-primary hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-6 h-6" fill={votedQuestions.has(question._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className={`font-semibold ${
                  votedQuestions.has(question._id) ? 'text-hipa-primary' : 'text-gray-700'
                }`}>
                  {formatCount(question.upvoteCount)}
                </span>
                <span className="text-xs text-gray-500">votes</span>
                
                {/* Answer Count */}
                <div className={`mt-2 px-2 py-1 rounded-lg text-center ${
                  hasAcceptedAnswer
                    ? 'bg-green-100 text-green-700'
                    : question.answers.length > 0
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <span className="font-semibold text-lg block">{question.answers.length}</span>
                  <span className="text-xs">answers</span>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/community/questions/${question.slug}`}
                  className="font-semibold text-lg text-gray-900 hover:text-hipa-primary transition-colors line-clamp-2"
                >
                  {question.title}
                </Link>

                <p className="text-gray-600 mt-2 line-clamp-2">
                  {question.content.text}
                </p>

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {question.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/search?tag=${tag}`}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                      {question.author.avatar ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden relative">
                          <Image
                            src={question.author.avatar}
                            alt={question.author.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-hipa-primary/20 flex items-center justify-center text-xs font-medium text-hipa-primary">
                          {question.author.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm text-gray-600">{question.author.name}</span>
                      <span className="text-xs text-gray-400">{getTimeAgo(question.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatCount(question.viewCount)} views</span>
                  </div>
                </div>

                {/* Accepted Answer Preview */}
                {hasAcceptedAnswer && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-700">Accepted Answer</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {question.answers.find(a => a.isAcceptedAnswer)?.content.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
