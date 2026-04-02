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

export const sellersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    verified?: boolean;
  }) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi(`/sellers?${queryString}`);
  },

  getById: async (id: string) => {
    return fetchApi(`/sellers/${id}`);
  },

  getBySlug: async (slug: string) => {
    return fetchApi(`/sellers/slug/${slug}`);
  },

  register: async (sellerData: any) => {
    return fetchApi('/sellers/register', {
      method: 'POST',
      body: JSON.stringify(sellerData),
    });
  },

  update: async (id: string, sellerData: any) => {
    return fetchApi(`/sellers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sellerData),
    });
  },

  getAnalytics: async (id: string, period?: string) => {
    return fetchApi(`/sellers/${id}/analytics?period=${period || '30d'}`);
  },
};

export default sellersApi;
