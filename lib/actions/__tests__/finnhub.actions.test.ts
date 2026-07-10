import { getNews, fetchJSON } from '../finnhub.actions';

// Mock environment variable
process.env.NEXT_PUBLIC_FINNHUB_API_KEY = 'test-api-key';

// Mock fetch globally
global.fetch = jest.fn();

describe('Finnhub Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('fetchJSON', () => {
    it('should fetch and parse JSON successfully', async () => {
      const mockData = { result: 'success' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchJSON('https://api.example.com/data');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        { cache: 'no-store' }
      );
    });

    it('should use cache with revalidation when specified', async () => {
      const mockData = { result: 'cached' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchJSON('https://api.example.com/cached', 300);
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/cached',
        { cache: 'force-cache', next: { revalidate: 300 } }
      );
    });

    it('should throw error on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(fetchJSON('https://api.example.com/error')).rejects.toThrow(
        'Fetch failed 404: Not Found'
      );
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(fetchJSON('https://api.example.com/error')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle response text error gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockRejectedValueOnce(new Error('Text parse error')),
      });

      await expect(fetchJSON('https://api.example.com/error')).rejects.toThrow(
        'Fetch failed 500: '
      );
    });
  });

  describe('getNews', () => {
    const mockValidArticle: RawNewsArticle = {
      id: 1,
      headline: 'Test Article',
      summary: 'Test summary for article',
      url: 'https://example.com/article',
      datetime: 1234567890,
      source: 'Test Source',
      image: 'https://example.com/image.jpg',
      category: 'general',
      related: 'AAPL',
    };

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should fetch company news for provided symbols', async () => {
      const mockArticles = [mockValidArticle];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockArticles,
      });

      const result = await getNews(['AAPL', 'TSLA']);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
      // Should call company-news endpoint for each symbol
      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(calls.some((call: any[]) => call[0].includes('company-news'))).toBe(true);
    });

    it('should filter out invalid articles', async () => {
      const invalidArticle: RawNewsArticle = {
        id: 2,
        headline: '',
        summary: 'Test',
        url: 'https://example.com',
        datetime: 1234567890,
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockValidArticle, invalidArticle],
      });

      const result = await getNews(['AAPL']);
      expect(result.length).toBeGreaterThan(0);
      // All returned articles should be valid
      result.forEach(article => {
        expect(article.headline).toBeTruthy();
        expect(article.summary).toBeTruthy();
        expect(article.url).toBeTruthy();
      });
    });

    it('should fall back to general news when no symbols provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockValidArticle],
      });

      const result = await getNews();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(calls.some((call: any[]) => call[0].includes('news?category=general'))).toBe(true);
    });

    it('should fall back to general news when company news returns no results', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        callCount++;
        if (url.includes('company-news')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [mockValidArticle],
        });
      });

      const result = await getNews(['AAPL']);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty symbols array', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockValidArticle],
      });

      const result = await getNews([]);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should clean and uppercase symbols', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockValidArticle],
      });

      await getNews(['  aapl  ', 'tsla']);
      const calls = (global.fetch as jest.Mock).mock.calls;
      // Check that URLs contain uppercased symbols
      const companyNewsCalls = calls.filter((call: any[]) => 
        call[0].includes('company-news')
      );
      expect(companyNewsCalls.length).toBeGreaterThan(0);
      companyNewsCalls.forEach((call: any[]) => {
        expect(call[0]).toMatch(/symbol=(AAPL|TSLA)/);
      });
    });

    it('should limit articles to maxArticles (6)', async () => {
      const manyArticles = Array.from({ length: 20 }, (_, i) => ({
        ...mockValidArticle,
        id: i + 1,
        headline: `Article ${i + 1}`,
      }));
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => manyArticles,
      });

      const result = await getNews();
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('should deduplicate general news articles', async () => {
      const duplicateArticles = [
        mockValidArticle,
        { ...mockValidArticle, id: mockValidArticle.id }, // Same ID
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => duplicateArticles,
      });

      const result = await getNews();
      // Should have removed duplicate
      const ids = result.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should sort articles by datetime descending', async () => {
      const articles = [
        { ...mockValidArticle, id: 1, datetime: 1000 },
        { ...mockValidArticle, id: 2, datetime: 3000 },
        { ...mockValidArticle, id: 3, datetime: 2000 },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => articles,
      });

      const result = await getNews(['AAPL']);
      // Should be sorted in descending order
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].datetime).toBeGreaterThanOrEqual(result[i].datetime);
      }
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(getNews()).rejects.toThrow('Failed to fetch news');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle individual symbol fetch failures', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        callCount++;
        if (url.includes('symbol=FAIL')) {
          return Promise.reject(new Error('Symbol fetch failed'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => [mockValidArticle],
        });
      });

      const result = await getNews(['AAPL', 'FAIL', 'TSLA']);
      // Should still return results from successful fetches
      expect(result).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });

    it('should round-robin select articles from multiple symbols', async () => {
      const appleArticles = [
        { ...mockValidArticle, id: 1, related: 'AAPL', headline: 'Apple 1' },
        { ...mockValidArticle, id: 2, related: 'AAPL', headline: 'Apple 2' },
      ];
      const teslaArticles = [
        { ...mockValidArticle, id: 3, related: 'TSLA', headline: 'Tesla 1' },
        { ...mockValidArticle, id: 4, related: 'TSLA', headline: 'Tesla 2' },
      ];

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('symbol=AAPL')) {
          return Promise.resolve({ ok: true, json: async () => appleArticles });
        }
        if (url.includes('symbol=TSLA')) {
          return Promise.resolve({ ok: true, json: async () => teslaArticles });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      const result = await getNews(['AAPL', 'TSLA']);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('should filter out null/undefined symbols', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockValidArticle],
      });

      const result = await getNews(['AAPL', null as any, undefined as any, '', '  ']);
      expect(result).toBeDefined();
      // Should only make one call for AAPL (invalid symbols filtered out)
      const calls = (global.fetch as jest.Mock).mock.calls;
      const companyNewsCalls = calls.filter((call: any[]) => 
        call[0].includes('company-news')
      );
      expect(companyNewsCalls.length).toBe(1);
    });
  });
});