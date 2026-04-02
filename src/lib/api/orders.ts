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

export const ordersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi(`/orders?${queryString}`);
  },

  getById: async (id: string) => {
    return fetchApi(`/orders/${id}`);
  },

  create: async (orderData: any) => {
    return fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return fetchApi(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  cancel: async (id: string, reason: string) => {
    return fetchApi(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getTracking: async (id: string) => {
    return fetchApi(`/orders/${id}/tracking`);
  },
};

export default ordersApi;
