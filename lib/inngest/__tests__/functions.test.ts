import { sendSignUpEmail, sendDailyNewsSummary } from '../functions';

// Mock dependencies
jest.mock('@/lib/inngest/client', () => ({
  inngest: {
    createFunction: jest.fn((config, events, handler) => {
      return { config, events, handler };
    }),
  },
}));

jest.mock('@/lib/nodemailer', () => ({
  sendWelcomeEmail: jest.fn(),
  sendNewsSummaryEmail: jest.fn(),
}));

jest.mock('@/lib/actions/user.actions', () => ({
  getAllUsersForNewsEmail: jest.fn(),
}));

jest.mock('@/lib/actions/watchlist.actions', () => ({
  getWatchlistSymbolsByEmail: jest.fn(),
}));

jest.mock('@/lib/actions/finnhub.actions', () => ({
  getNews: jest.fn(),
}));

import { inngest } from '@/lib/inngest/client';
import { sendWelcomeEmail, sendNewsSummaryEmail } from '@/lib/nodemailer';
import { getAllUsersForNewsEmail } from '@/lib/actions/user.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';

describe('Inngest Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('sendSignUpEmail', () => {
    it('should be properly configured', () => {
      expect(sendSignUpEmail).toBeDefined();
      expect(sendSignUpEmail.config).toEqual({ id: 'sign-up-email' });
      expect(sendSignUpEmail.events).toEqual([{ event: 'app/user.signup' }]);
      expect(sendSignUpEmail.handler).toBeDefined();
    });

    it('should process signup event with AI-generated intro', async () => {
      const mockEvent = {
        data: {
          email: 'newuser@example.com',
          name: 'New User',
          country: 'US',
          investmentGoals: 'retirement',
          riskTolerance: 'moderate',
          preferredIndustry: 'technology',
        },
      };

      const mockAiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Welcome\! Your retirement goals are within reach.</p>',
                },
              ],
            },
          },
        ],
      };

      const mockStep = {
        run: jest.fn((name, fn) => fn()),
        ai: {
          infer: jest.fn().mockResolvedValue(mockAiResponse),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await sendSignUpEmail.handler({
        event: mockEvent,
        step: mockStep,
      } as any);

      expect(result).toEqual({
        success: true,
        message: 'Welcome email sent successfully',
      });
      expect(mockStep.ai.infer).toHaveBeenCalled();
      expect(sendWelcomeEmail).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        name: 'New User',
        intro: expect.stringContaining('<p class="mobile-text"'),
      });
    });

    it('should handle AI inference failure gracefully', async () => {
      const mockEvent = {
        data: {
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      const mockAiResponse = {
        candidates: [
          {
            content: {
              parts: [],
            },
          },
        ],
      };

      const mockStep = {
        run: jest.fn((name, fn) => fn()),
        ai: {
          infer: jest.fn().mockResolvedValue(mockAiResponse),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await sendSignUpEmail.handler({
        event: mockEvent,
        step: mockStep,
      } as any);

      expect(result.success).toBe(true);
      expect(sendWelcomeEmail).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'Test User',
        intro: expect.any(String),
      });
    });

    it('should handle email sending failure', async () => {
      const mockEvent = {
        data: {
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      const mockAiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '<p>Intro</p>' }],
            },
          },
        ],
      };

      const mockStep = {
        run: jest.fn((name, fn) => fn()),
        ai: {
          infer: jest.fn().mockResolvedValue(mockAiResponse),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (sendWelcomeEmail as jest.Mock).mockRejectedValue(new Error('Email failed'));

      await expect(
        sendSignUpEmail.handler({
          event: mockEvent,
          step: mockStep,
        } as any)
      ).rejects.toThrow('Email failed');
    });

    it('should build proper user profile for AI prompt', async () => {
      const mockEvent = {
        data: {
          email: 'investor@example.com',
          name: 'Savvy Investor',
          country: 'UK',
          investmentGoals: 'wealth building',
          riskTolerance: 'aggressive',
          preferredIndustry: 'biotech',
        },
      };

      const mockAiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '<p>Personalized intro</p>' }],
            },
          },
        ],
      };

      const mockStep = {
        run: jest.fn((name, fn) => fn()),
        ai: {
          infer: jest.fn().mockResolvedValue(mockAiResponse),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      await sendSignUpEmail.handler({
        event: mockEvent,
        step: mockStep,
      } as any);

      const inferCall = (mockStep.ai.infer as jest.Mock).mock.calls[0];
      const promptBody = inferCall[1].body.contents[0].parts[0].text;

      expect(promptBody).toContain('wealth building');
      expect(promptBody).toContain('aggressive');
      expect(promptBody).toContain('biotech');
    });
  });

  describe('sendDailyNewsSummary', () => {
    it('should be properly configured', () => {
      expect(sendDailyNewsSummary).toBeDefined();
      expect(sendDailyNewsSummary.config).toEqual({ id: 'daily-news-summary' });
      expect(sendDailyNewsSummary.events).toEqual([
        { event: 'app/send.daily.news' },
        { cron: '0 12 * * *' },
      ]);
      expect(sendDailyNewsSummary.handler).toBeDefined();
    });

    it('should return early when no users found', async () => {
      const mockStep = {
        run: jest.fn((name, fn) => fn()),
        ai: {
          infer: jest.fn(),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (getAllUsersForNewsEmail as jest.Mock).mockResolvedValue([]);

      const result = await sendDailyNewsSummary.handler({
        event: {} as any,
        step: mockStep,
      } as any);

      expect(result).toEqual({
        success: false,
        message: 'No users found for news email',
      });
      expect(mockStep.ai.infer).not.toHaveBeenCalled();
    });

    it('should fetch news for users with watchlists', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', name: 'User One' },
        { id: 'user2', email: 'user2@example.com', name: 'User Two' },
      ];

      const mockArticles: MarketNewsArticle[] = [
        {
          id: 1,
          headline: 'Test Article',
          summary: 'Test summary',
          source: 'Test Source',
          url: 'https://example.com',
          datetime: 1234567890,
          image: '',
          category: 'general',
          related: 'AAPL',
        },
      ];

      let stepRunCallCount = 0;
      const mockStep = {
        run: jest.fn((name, fn) => {
          stepRunCallCount++;
          if (stepRunCallCount === 1) {
            // First run: get-all-users
            return mockUsers;
          } else if (stepRunCallCount === 2) {
            // Second run: fetch-user-news
            return fn();
          } else {
            // Third run: send-news-emails
            return fn();
          }
        }),
        ai: {
          infer: jest.fn().mockResolvedValue({
            candidates: [
              {
                content: {
                  parts: [{ text: '<div>News summary</div>' }],
                },
              },
            ],
          }),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (getWatchlistSymbolsByEmail as jest.Mock).mockResolvedValue(['AAPL', 'TSLA']);
      (getNews as jest.Mock).mockResolvedValue(mockArticles);
      (sendNewsSummaryEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await sendDailyNewsSummary.handler({
        event: {} as any,
        step: mockStep,
      } as any);

      expect(result.success).toBe(true);
      expect(getWatchlistSymbolsByEmail).toHaveBeenCalledTimes(2);
      expect(getNews).toHaveBeenCalled();
    });

    it('should fall back to general news when user has no watchlist', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', name: 'User One' },
      ];

      const mockArticles: MarketNewsArticle[] = [
        {
          id: 1,
          headline: 'General News',
          summary: 'Summary',
          source: 'Source',
          url: 'https://example.com',
          datetime: 1234567890,
          image: '',
          category: 'general',
          related: '',
        },
      ];

      let stepRunCallCount = 0;
      const mockStep = {
        run: jest.fn((name, fn) => {
          stepRunCallCount++;
          if (stepRunCallCount === 1) {
            return mockUsers;
          } else if (stepRunCallCount === 2) {
            return fn();
          } else {
            return fn();
          }
        }),
        ai: {
          infer: jest.fn().mockResolvedValue({
            candidates: [
              {
                content: {
                  parts: [{ text: '<div>News</div>' }],
                },
              },
            ],
          }),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (getWatchlistSymbolsByEmail as jest.Mock).mockResolvedValue([]);
      (getNews as jest.Mock).mockResolvedValue(mockArticles);
      (sendNewsSummaryEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await sendDailyNewsSummary.handler({
        event: {} as any,
        step: mockStep,
      } as any);

      expect(result.success).toBe(true);
      expect(getNews).toHaveBeenCalledWith([]);
      expect(getNews).toHaveBeenCalledWith();
    });

    it('should limit articles to 6 per user', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', name: 'User One' },
      ];

      const manyArticles: MarketNewsArticle[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        headline: `Article ${i + 1}`,
        summary: 'Summary',
        source: 'Source',
        url: 'https://example.com',
        datetime: 1234567890,
        image: '',
        category: 'general',
        related: '',
      }));

      let stepRunCallCount = 0;
      const mockStep = {
        run: jest.fn((name, fn) => {
          stepRunCallCount++;
          if (stepRunCallCount === 1) {
            return mockUsers;
          } else if (stepRunCallCount === 2) {
            return fn();
          } else {
            return fn();
          }
        }),
        ai: {
          infer: jest.fn().mockResolvedValue({
            candidates: [
              {
                content: {
                  parts: [{ text: '<div>News</div>' }],
                },
              },
            ],
          }),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (getWatchlistSymbolsByEmail as jest.Mock).mockResolvedValue(['AAPL']);
      (getNews as jest.Mock).mockResolvedValue(manyArticles);
      (sendNewsSummaryEmail as jest.Mock).mockResolvedValue(undefined);

      await sendDailyNewsSummary.handler({
        event: {} as any,
        step: mockStep,
      } as any);

      // Check that AI infer was called with max 6 articles
      const inferCall = (mockStep.ai.infer as jest.Mock).mock.calls[0];
      const promptBody = inferCall[1].body.contents[0].parts[0].text;
      const newsDataMatch = promptBody.match(/\[[\s\S]*\]/);
      if (newsDataMatch) {
        const newsData = JSON.parse(newsDataMatch[0]);
        expect(newsData.length).toBeLessThanOrEqual(6);
      }
    });

    it('should handle user with no news gracefully', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', name: 'User One' },
      ];

      let stepRunCallCount = 0;
      const mockStep = {
        run: jest.fn((name, fn) => {
          stepRunCallCount++;
          if (stepRunCallCount === 1) {
            return mockUsers;
          } else if (stepRunCallCount === 2) {
            return fn();
          } else {
            return fn();
          }
        }),
        ai: {
          infer: jest.fn().mockResolvedValue({
            candidates: [
              {
                content: {
                  parts: [{ text: null }],
                },
              },
            ],
          }),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (getWatchlistSymbolsByEmail as jest.Mock).mockResolvedValue([]);
      (getNews as jest.Mock).mockResolvedValue([]);
      (sendNewsSummaryEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await sendDailyNewsSummary.handler({
        event: {} as any,
        step: mockStep,
      } as any);

      expect(result.success).toBe(true);
      // Should not send email if no news content
      expect(sendNewsSummaryEmail).not.toHaveBeenCalled();
    });

    it('should handle AI summarization errors per user', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', name: 'User One' },
        { id: 'user2', email: 'user2@example.com', name: 'User Two' },
      ];

      const mockArticles: MarketNewsArticle[] = [
        {
          id: 1,
          headline: 'Test',
          summary: 'Test',
          source: 'Test',
          url: 'https://example.com',
          datetime: 1234567890,
          image: '',
          category: 'general',
          related: '',
        },
      ];

      let stepRunCallCount = 0;
      let inferCallCount = 0;
      const mockStep = {
        run: jest.fn((name, fn) => {
          stepRunCallCount++;
          if (stepRunCallCount === 1) {
            return mockUsers;
          } else if (stepRunCallCount === 2) {
            return fn();
          } else {
            return fn();
          }
        }),
        ai: {
          infer: jest.fn().mockImplementation(() => {
            inferCallCount++;
            if (inferCallCount === 1) {
              return Promise.reject(new Error('AI Error'));
            }
            return Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [{ text: '<div>News</div>' }],
                  },
                },
              ],
            });
          }),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (getWatchlistSymbolsByEmail as jest.Mock).mockResolvedValue([]);
      (getNews as jest.Mock).mockResolvedValue(mockArticles);
      (sendNewsSummaryEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await sendDailyNewsSummary.handler({
        event: {} as any,
        step: mockStep,
      } as any);

      expect(result.success).toBe(true);
      expect(console.error).toHaveBeenCalled();
      // Should send email for user2 but not user1
      expect(sendNewsSummaryEmail).toHaveBeenCalledTimes(1);
    });

    it('should handle individual user news fetch errors', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', name: 'User One' },
      ];

      let stepRunCallCount = 0;
      const mockStep = {
        run: jest.fn((name, fn) => {
          stepRunCallCount++;
          if (stepRunCallCount === 1) {
            return mockUsers;
          } else if (stepRunCallCount === 2) {
            return fn();
          } else {
            return fn();
          }
        }),
        ai: {
          infer: jest.fn().mockResolvedValue({
            candidates: [
              {
                content: {
                  parts: [{ text: '<div>News</div>' }],
                },
              },
            ],
          }),
          models: {
            gemini: jest.fn((options) => `gemini-model-${options.model}`),
          },
        },
      };

      (getWatchlistSymbolsByEmail as jest.Mock).mockRejectedValue(new Error('Watchlist error'));
      (getNews as jest.Mock).mockRejectedValue(new Error('News error'));
      (sendNewsSummaryEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await sendDailyNewsSummary.handler({
        event: {} as any,
        step: mockStep,
      } as any);

      expect(result.success).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
  });
});