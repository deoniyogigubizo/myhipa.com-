const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
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

// Products API
export const productsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi(`/products?${queryString}`);
  },

  getById: async (id: string) => {
    return fetchApi(`/products/${id}`);
  },

  getBySlug: async (slug: string) => {
    return fetchApi(`/products/slug/${slug}`);
  },

  create: async (productData: any) => {
    return fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  update: async (id: string, productData: any) => {
    return fetchApi(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  delete: async (id: string) => {
    return fetchApi(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

export default productsApi;
