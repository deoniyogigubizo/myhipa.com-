const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      data: null as T, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export const communityApi = {
  // Posts
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    groupId?: string;
  }) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi(`/community/posts?${queryString}`);
  },

  createPost: async (postData: any) => {
    return fetchApi('/community/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  deletePost: async (id: string) => {
    return fetchApi(`/community/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // Groups
  getGroups: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi(`/community/groups?${queryString}`);
  },

  joinGroup: async (groupId: string) => {
    return fetchApi(`/community/groups/${groupId}/join`, {
      method: 'POST',
    });
  },

  leaveGroup: async (groupId: string) => {
    return fetchApi(`/community/groups/${groupId}/leave`, {
      method: 'POST',
    });
  },

  // Questions
  getQuestions: async (params?: {
    page?: number;
    limit?: number;
    answered?: boolean;
  }) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi(`/community/questions?${queryString}`);
  },

  askQuestion: async (questionData: any) => {
    return fetchApi('/community/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  },

  answerQuestion: async (questionId: string, answer: string) => {
    return fetchApi(`/community/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  },

  // Notifications
  getNotifications: async () => {
    return fetchApi('/community/notifications');
  },

  markNotificationRead: async (id: string) => {
    return fetchApi(`/community/notifications/${id}/read`, {
      method: 'POST',
    });
  },
};

export default communityApi;
