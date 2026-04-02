// Mock Elasticsearch Client (install @elastic/elasticsearch for production)
type Client = any;
const Client = class {
  constructor(options?: any) {}
  async index(params: any) { return {}; }
  async bulk(params: any) { return {}; }
  async search(params: any) { return { hits: { hits: [], total: 0 }, took: 0 }; }
  async delete(params: any) { return {}; }
  indices = {
    exists: async (params: any) => false,
    create: async (params: any) => {},
  };
};

import { ConfigService } from '@nestjs/config';

// ============================================
// Elasticsearch Search Service
// ============================================

export interface ProductDocument {
  id: string;
  title: string;
  description: string;
  category: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  tags: string[];
  price: number;
  sellerId: string;
  sellerName: string;
  rating: number;
  reviewCount: number;
  stock: number;
  status: string;
  createdAt: string;
  embedding?: number[];
}

export interface SearchOptions {
  query?: string;
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: string;
    tags?: string[];
    inStock?: boolean;
  };
  sort?: {
    field: 'relevance' | 'price' | 'rating' | 'createdAt';
    order: 'asc' | 'desc';
  };
  from?: number;
  size?: number;
}

export interface SearchResult<T> {
  hits: Array<{
    _id: string;
    _score: number;
    _source: T;
  }>;
  total: number;
  took: number;
}

export class ElasticsearchService {
  private readonly client: Client;
  private readonly indexName: string;

  constructor(private readonly configService: ConfigService) {
    const node = this.configService.get<string>('elasticsearch.node') || 'http://localhost:9200';
    const apiKey = this.configService.get<string>('elasticsearch.apiKey');
    
    this.client = new Client({
      node,
      ...(apiKey && { auth: { apiKey } }),
    });
    
    this.indexName = this.configService.get<string>('elasticsearch.index') || 'myhipa-products';
  }

  /**
   * Index a product document
   */
  async indexProduct(product: ProductDocument): Promise<void> {
    await this.client.index({
      index: this.indexName,
      id: product.id,
      document: product,
    });
  }

  /**
   * Bulk index multiple products
   */
  async bulkIndex(products: ProductDocument[]): Promise<void> {
    const operations = products.flatMap((product) => [
      { index: { _index: this.indexName, _id: product.id } },
      product,
    ]);

    await this.client.bulk({ operations, refresh: true });
  }

  /**
   * Search products
   */
  async search(options: SearchOptions): Promise<SearchResult<ProductDocument>> {
    const must: Array<Record<string, unknown>> = [];
    const filter: Array<Record<string, unknown>> = [];

    // Full-text search
    if (options.query) {
      must.push({
        multi_match: {
          query: options.query,
          fields: ['title^3', 'description^2', 'tags', 'category.primary', 'category.secondary'],
          fuzziness: 'AUTO',
        },
      });
    }

    // Filters
    if (options.filters) {
      const { category, minPrice, maxPrice, sellerId, tags, inStock } = options.filters;

      if (category) {
        filter.push({
          bool: {
            should: [
              { term: { 'category.primary': category } },
              { term: { 'category.secondary': category } },
            ],
          },
        });
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        const range: Record<string, unknown> = {};
        if (minPrice !== undefined) range.gte = minPrice;
        if (maxPrice !== undefined) range.lte = maxPrice;
        filter.push({ range: { price: range } });
      }

      if (sellerId) {
        filter.push({ term: { sellerId } });
      }

      if (tags?.length) {
        filter.push({ terms: { tags } });
      }

      if (inStock) {
        filter.push({ range: { stock: { gt: 0 } } });
      }
    }

    // Only active products
    filter.push({ term: { status: 'active' } });

    const response = await this.client.search({
      index: this.indexName,
      body: {
        query: {
          bool: {
            must: must.length ? must : [{ match_all: {} }],
            filter,
          },
        },
        sort: this.buildSort(options.sort),
        from: options.from || 0,
        size: options.size || 20,
        aggs: this.buildAggregations(),
      },
    });

    return {
      hits: response.hits.hits.map((hit) => ({
        _id: hit._id,
        _score: hit._score || 0,
        _source: hit._source as ProductDocument,
      })),
      total: typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0,
      took: response.took,
    };
  }

  /**
   * Build sort configuration
   */
  private buildSort(sort?: SearchOptions['sort']) {
    if (!sort) {
      return [{ _score: 'desc' }, { createdAt: 'desc' }];
    }

    const sortMap: Record<string, { [key: string]: string }> = {
      relevance: { _score: 'desc' },
      price: { price: sort.order },
      rating: { rating: sort.order },
      createdAt: { createdAt: sort.order },
    };

    return [sortMap[sort.field] || { _score: 'desc' }];
  }

  /**
   * Build aggregations for faceted search
   */
  private buildAggregations() {
    return {
      categories: {
        terms: { field: 'category.primary', size: 20 },
      },
      price_ranges: {
        range: {
          field: 'price',
          ranges: [
            { key: '0-50000', from: 0, to: 50000 },
            { key: '50000-100000', from: 50000, to: 100000 },
            { key: '100000-200000', from: 100000, to: 200000 },
            { key: '200000-500000', from: 200000, to: 500000 },
            { key: '500000+', from: 500000 },
          ],
        },
      },
      tags: {
        terms: { field: 'tags', size: 30 },
      },
      avg_rating: {
        avg: { field: 'rating' },
      },
    };
  }

  /**
   * Delete a product document
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: productId,
      });
    } catch (error) {
      // Ignore if not found
      console.log('Product not found for deletion:', productId);
    }
  }

  /**
   * Create index with mappings
   */
  async createIndex(): Promise<void> {
    const exists = await this.client.indices.exists({ index: this.indexName });
    
    if (!exists) {
      await this.client.indices.create({
        index: this.indexName,
        body: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                hipa_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball'],
                },
              },
            },
          },
          mappings: {
            properties: {
              title: { type: 'text', analyzer: 'hipa_analyzer' },
              description: { type: 'text', analyzer: 'hipa_analyzer' },
              category: {
                properties: {
                  primary: { type: 'keyword' },
                  secondary: { type: 'keyword' },
                  tertiary: { type: 'keyword' },
                },
              },
              tags: { type: 'keyword' },
              price: { type: 'float' },
              sellerId: { type: 'keyword' },
              sellerName: { type: 'text' },
              rating: { type: 'float' },
              reviewCount: { type: 'integer' },
              stock: { type: 'integer' },
              status: { type: 'keyword' },
              createdAt: { type: 'date' },
              embedding: {
                type: 'dense_vector',
                dims: 1536,
                index: true,
                similarity: 'cosine',
              },
            },
          },
        },
      });
    }
  }

  /**
   * Vector search for semantic similarity
   */
  async vectorSearch(
    embedding: number[],
    options: {
      filters?: SearchOptions['filters'];
      size?: number;
    }
  ): Promise<SearchResult<ProductDocument>> {
    const filter: Array<Record<string, unknown>> = [];

    if (options.filters) {
      if (options.filters.category) {
        filter.push({ term: { 'category.primary': options.filters.category } });
      }
      filter.push({ term: { status: 'active' } });
      filter.push({ range: { stock: { gt: 0 } } });
    }

    const response = await this.client.search({
      index: this.indexName,
      body: {
        query: {
          bool: {
            filter,
            must: [
              {
                knn: {
                  field: 'embedding',
                  vector: embedding,
                  k: options.size || 20,
                  num_candidates: 100,
                },
              },
            ],
          },
        },
        size: options.size || 20,
      },
    });

    return {
      hits: response.hits.hits.map((hit) => ({
        _id: hit._id,
        _score: hit._score || 0,
        _source: hit._source as ProductDocument,
      })),
      total: typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0,
      took: response.took,
    };
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(days: number = 7) {
    const result = await this.client.search({
      index: this.indexName,
      body: {
        size: 0,
        query: { match_all: {} },
        aggs: {
          zero_result_queries: {
            filter: { term: { _name: 'zero_result' } },
          },
          popular_queries: {
            terms: { field: 'search_query.keyword', size: 50 },
          },
        },
      },
    });

    return result.aggregations;
  }
}
