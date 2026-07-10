import {
  cn,
  formatTimeAgo,
  delay,
  formatMarketCapValue,
  getDateRange,
  getTodayDateRange,
  calculateNewsDistribution,
  validateArticle,
  getTodayString,
  formatArticle,
  formatChangePercent,
  getChangeColorClass,
  formatPrice,
  formatDateToday,
  getAlertText,
} from '../utils';

describe('Utils Module', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('btn', 'btn-primary');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle conditional classes', () => {
      const result = cn('btn', { 'btn-active': true, 'btn-disabled': false });
      expect(result).toContain('btn');
      expect(result).toContain('btn-active');
      expect(result).not.toContain('btn-disabled');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });

  describe('formatTimeAgo', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format minutes correctly', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('5 minutes ago');
    });

    it('should format hours correctly', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('2 hours ago');
    });

    it('should format days correctly', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 86400 * 3; // 3 days ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('3 days ago');
    });

    it('should handle singular hour', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('1 hour ago');
    });

    it('should handle singular day', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('1 day ago');
    });

    it('should handle 0 minutes', () => {
      const timestamp = Math.floor(Date.now() / 1000); // now
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('0 minutes ago');
    });
  });

  describe('delay', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay for specified milliseconds', async () => {
      const promise = delay(1000);
      jest.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should handle zero delay', async () => {
      const promise = delay(0);
      jest.advanceTimersByTime(0);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('formatMarketCapValue', () => {
    it('should format trillions correctly', () => {
      expect(formatMarketCapValue(3100000)).toBe('$3.10T');
      expect(formatMarketCapValue(1000000)).toBe('$1.00T');
    });

    it('should format billions correctly', () => {
      expect(formatMarketCapValue(900000)).toBe('$900.00B');
      expect(formatMarketCapValue(1500)).toBe('$1.50B');
    });

    it('should format millions correctly', () => {
      expect(formatMarketCapValue(500)).toBe('$500.00M');
      expect(formatMarketCapValue(1)).toBe('$1.00M');
    });

    it('should handle zero and null values', () => {
      expect(formatMarketCapValue(0)).toBe('N/A');
      expect(formatMarketCapValue(null as any)).toBe('N/A');
      expect(formatMarketCapValue(undefined as any)).toBe('N/A');
    });
  });

  describe('getDateRange', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return date range for specified days', () => {
      const result = getDateRange(5);
      expect(result).toEqual({
        to: '2024-01-15',
        from: '2024-01-10',
      });
    });

    it('should handle single day range', () => {
      const result = getDateRange(1);
      expect(result).toEqual({
        to: '2024-01-15',
        from: '2024-01-14',
      });
    });

    it('should handle zero days', () => {
      const result = getDateRange(0);
      expect(result).toEqual({
        to: '2024-01-15',
        from: '2024-01-15',
      });
    });
  });

  describe('getTodayDateRange', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return today as both from and to', () => {
      const result = getTodayDateRange();
      expect(result).toEqual({
        to: '2024-01-15',
        from: '2024-01-15',
      });
    });
  });

  describe('calculateNewsDistribution', () => {
    it('should return 3 items per symbol for fewer than 3 symbols', () => {
      expect(calculateNewsDistribution(1)).toEqual({
        itemsPerSymbol: 3,
        targetNewsCount: 6,
      });
      expect(calculateNewsDistribution(2)).toEqual({
        itemsPerSymbol: 3,
        targetNewsCount: 6,
      });
    });

    it('should return 2 items per symbol for exactly 3 symbols', () => {
      expect(calculateNewsDistribution(3)).toEqual({
        itemsPerSymbol: 2,
        targetNewsCount: 6,
      });
    });

    it('should return 1 item per symbol for more than 3 symbols', () => {
      expect(calculateNewsDistribution(4)).toEqual({
        itemsPerSymbol: 1,
        targetNewsCount: 6,
      });
      expect(calculateNewsDistribution(10)).toEqual({
        itemsPerSymbol: 1,
        targetNewsCount: 6,
      });
    });
  });

  describe('validateArticle', () => {
    it('should validate complete article', () => {
      const article: RawNewsArticle = {
        id: 1,
        headline: 'Test headline',
        summary: 'Test summary',
        url: 'https://example.com',
        datetime: 1234567890,
      };
      expect(validateArticle(article)).toBe(true);
    });

    it('should reject article without headline', () => {
      const article: RawNewsArticle = {
        id: 1,
        summary: 'Test summary',
        url: 'https://example.com',
        datetime: 1234567890,
      };
      expect(validateArticle(article)).toBe(false);
    });

    it('should reject article without summary', () => {
      const article: RawNewsArticle = {
        id: 1,
        headline: 'Test headline',
        url: 'https://example.com',
        datetime: 1234567890,
      };
      expect(validateArticle(article)).toBe(false);
    });

    it('should reject article without url', () => {
      const article: RawNewsArticle = {
        id: 1,
        headline: 'Test headline',
        summary: 'Test summary',
        datetime: 1234567890,
      };
      expect(validateArticle(article)).toBe(false);
    });

    it('should reject article without datetime', () => {
      const article: RawNewsArticle = {
        id: 1,
        headline: 'Test headline',
        summary: 'Test summary',
        url: 'https://example.com',
      };
      expect(validateArticle(article)).toBe(false);
    });

    it('should reject article with empty strings', () => {
      const article: RawNewsArticle = {
        id: 1,
        headline: '',
        summary: 'Test summary',
        url: 'https://example.com',
        datetime: 1234567890,
      };
      expect(validateArticle(article)).toBe(false);
    });
  });

  describe('getTodayString', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return today date string', () => {
      expect(getTodayString()).toBe('2024-01-15');
    });
  });

  describe('formatArticle', () => {
    it('should format company news article', () => {
      const rawArticle: RawNewsArticle = {
        id: 123,
        headline: 'Company News Headline',
        summary: 'A'.repeat(250) + ' more text',
        source: 'Test Source',
        url: 'https://example.com',
        datetime: 1234567890,
        image: 'https://example.com/image.jpg',
      };
      
      const result = formatArticle(rawArticle, true, 'AAPL', 0);
      
      expect(result.headline).toBe('Company News Headline');
      expect(result.summary.endsWith('...')).toBe(true);
      expect(result.summary.length).toBeLessThanOrEqual(204); // 200 + "..."
      expect(result.category).toBe('company');
      expect(result.related).toBe('AAPL');
      expect(result.url).toBe('https://example.com');
    });

    it('should format general news article', () => {
      const rawArticle: RawNewsArticle = {
        id: 456,
        headline: 'Market News Headline',
        summary: 'B'.repeat(200) + ' more text',
        url: 'https://example.com/news',
        datetime: 1234567890,
        category: 'general',
        related: 'TSLA',
      };
      
      const result = formatArticle(rawArticle, false, undefined, 1);
      
      expect(result.headline).toBe('Market News Headline');
      expect(result.summary.endsWith('...')).toBe(true);
      expect(result.summary.length).toBeLessThanOrEqual(154); // 150 + "..."
      expect(result.category).toBe('general');
      expect(result.related).toBe('TSLA');
      expect(result.id).toBe(457); // 456 + 1 (index)
    });

    it('should handle missing optional fields', () => {
      const rawArticle: RawNewsArticle = {
        id: 789,
        headline: 'Minimal Article',
        summary: 'Short summary',
        url: 'https://example.com/minimal',
        datetime: 1234567890,
      };
      
      const result = formatArticle(rawArticle, false, undefined, 0);
      
      expect(result.source).toBe('Market News');
      expect(result.image).toBe('');
      expect(result.category).toBe('general');
      expect(result.related).toBe('');
    });

    it('should trim whitespace from headline and summary', () => {
      const rawArticle: RawNewsArticle = {
        id: 100,
        headline: '  Headline with spaces  ',
        summary: '  Summary with spaces  ',
        url: 'https://example.com',
        datetime: 1234567890,
      };
      
      const result = formatArticle(rawArticle, false, undefined, 0);
      
      expect(result.headline).toBe('Headline with spaces');
      expect(result.summary).toBe('Summary with spaces...');
    });
  });

  describe('formatChangePercent', () => {
    it('should format positive change with + sign', () => {
      expect(formatChangePercent(5.25)).toBe('+5.25%');
      expect(formatChangePercent(0.01)).toBe('+0.01%');
    });

    it('should format negative change without extra sign', () => {
      expect(formatChangePercent(-3.45)).toBe('-3.45%');
      expect(formatChangePercent(-0.99)).toBe('-0.99%');
    });

    it('should handle zero', () => {
      expect(formatChangePercent(0)).toBe('');
    });

    it('should handle undefined and null', () => {
      expect(formatChangePercent(undefined)).toBe('');
      expect(formatChangePercent(null as any)).toBe('');
    });

    it('should round to 2 decimal places', () => {
      expect(formatChangePercent(5.12345)).toBe('+5.12%');
      expect(formatChangePercent(-3.98765)).toBe('-3.99%');
    });
  });

  describe('getChangeColorClass', () => {
    it('should return green for positive change', () => {
      expect(getChangeColorClass(0.01)).toBe('text-green-500');
      expect(getChangeColorClass(5.25)).toBe('text-green-500');
    });

    it('should return red for negative change', () => {
      expect(getChangeColorClass(-0.01)).toBe('text-red-500');
      expect(getChangeColorClass(-3.45)).toBe('text-red-500');
    });

    it('should return gray for zero', () => {
      expect(getChangeColorClass(0)).toBe('text-gray-400');
    });

    it('should return gray for undefined and null', () => {
      expect(getChangeColorClass(undefined)).toBe('text-gray-400');
      expect(getChangeColorClass(null as any)).toBe('text-gray-400');
    });
  });

  describe('formatPrice', () => {
    it('should format price with currency symbol and decimals', () => {
      expect(formatPrice(123.45)).toBe('$123.45');
      expect(formatPrice(1234.5)).toBe('$1,234.50');
      expect(formatPrice(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle integer prices', () => {
      expect(formatPrice(100)).toBe('$100.00');
    });

    it('should handle small prices', () => {
      expect(formatPrice(0.99)).toBe('$0.99');
      expect(formatPrice(0.01)).toBe('$0.01');
    });

    it('should handle zero', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });
  });

  describe('formatDateToday', () => {
    it('should be a formatted date string', () => {
      expect(typeof formatDateToday).toBe('string');
      expect(formatDateToday.length).toBeGreaterThan(0);
      // Should contain typical date parts
      expect(formatDateToday).toMatch(/\d{4}/); // year
    });
  });

  describe('getAlertText', () => {
    it('should format upper alert correctly', () => {
      const alert: Alert = {
        id: '1',
        symbol: 'AAPL',
        company: 'Apple Inc.',
        alertName: 'Test Alert',
        currentPrice: 150,
        alertType: 'upper',
        threshold: 160,
        frequency: 'once',
      };
      expect(getAlertText(alert)).toBe('Price > $160.00');
    });

    it('should format lower alert correctly', () => {
      const alert: Alert = {
        id: '2',
        symbol: 'TSLA',
        company: 'Tesla Inc.',
        alertName: 'Test Alert',
        currentPrice: 200,
        alertType: 'lower',
        threshold: 180,
        frequency: 'once',
      };
      expect(getAlertText(alert)).toBe('Price < $180.00');
    });

    it('should handle volume alerts', () => {
      const alert: Alert = {
        id: '3',
        symbol: 'GOOGL',
        company: 'Alphabet Inc.',
        alertName: 'Volume Alert',
        currentPrice: 140,
        alertType: 'volume',
        threshold: 1000000,
        frequency: 'daily',
      };
      expect(getAlertText(alert)).toBe('Price < $1,000,000.00');
    });
  });
});