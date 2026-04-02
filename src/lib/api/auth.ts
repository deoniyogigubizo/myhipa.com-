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

export const authApi = {
  login: async (email: string, password: string) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    role?: 'buyer' | 'seller';
  }) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    return fetchApi('/auth/me');
  },

  updateProfile: async (data: any) => {
    return fetchApi('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return fetchApi('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  verifyEmail: async (token: string) => {
    return fetchApi('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  requestPasswordReset: async (email: string) => {
    return fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

export default authApi;
