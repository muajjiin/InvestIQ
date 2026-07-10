import { getWatchlistSymbolsByEmail } from '../watchlist.actions';

// Mock database connection and model
jest.mock('@/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/database/models/watchlist.model', () => ({
  Watchlist: {
    find: jest.fn(),
  },
}));

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

describe('Watchlist Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('getWatchlistSymbolsByEmail', () => {
    it('should return symbols for valid user', async () => {
      const mockUser = { _id: 'userid123', id: 'userid123', email: 'user@example.com' };
      const mockWatchlistItems = [
        { symbol: 'AAPL' },
        { symbol: 'TSLA' },
        { symbol: 'GOOGL' },
      ];

      const mockFindOne = jest.fn().mockResolvedValue(mockUser);
      const mockCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const mockLean = jest.fn().mockResolvedValue(mockWatchlistItems);
      (Watchlist.find as jest.Mock).mockReturnValue({ lean: mockLean });

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual(['AAPL', 'TSLA', 'GOOGL']);
      expect(mockCollection).toHaveBeenCalledWith('user');
      expect(mockFindOne).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(Watchlist.find).toHaveBeenCalledWith(
        { userId: 'userid123' },
        { symbol: 1 }
      );
    });

    it('should return empty array for empty email', async () => {
      const result = await getWatchlistSymbolsByEmail('');
      expect(result).toEqual([]);
      expect(connectToDatabase).not.toHaveBeenCalled();
    });

    it('should return empty array for null email', async () => {
      const result = await getWatchlistSymbolsByEmail(null as any);
      expect(result).toEqual([]);
      expect(connectToDatabase).not.toHaveBeenCalled();
    });

    it('should return empty array when user not found', async () => {
      const mockFindOne = jest.fn().mockResolvedValue(null);
      const mockCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getWatchlistSymbolsByEmail('nonexistent@example.com');

      expect(result).toEqual([]);
      expect(Watchlist.find).not.toHaveBeenCalled();
    });

    it('should use _id when id is not available', async () => {
      const mockUser = { _id: 'objectid456', email: 'user@example.com' };
      const mockWatchlistItems = [{ symbol: 'MSFT' }];

      const mockFindOne = jest.fn().mockResolvedValue(mockUser);
      const mockCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const mockLean = jest.fn().mockResolvedValue(mockWatchlistItems);
      (Watchlist.find as jest.Mock).mockReturnValue({ lean: mockLean });

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual(['MSFT']);
      expect(Watchlist.find).toHaveBeenCalledWith(
        { userId: 'objectid456' },
        { symbol: 1 }
      );
    });

    it('should return empty array when userId is empty', async () => {
      const mockUser = { _id: '', id: '', email: 'user@example.com' };

      const mockFindOne = jest.fn().mockResolvedValue(mockUser);
      const mockCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual([]);
      expect(Watchlist.find).not.toHaveBeenCalled();
    });

    it('should return empty array when db is null', async () => {
      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: null,
        },
      });

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual([]);
    });

    it('should handle database connection error', async () => {
      (connectToDatabase as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle Watchlist query error', async () => {
      const mockUser = { _id: 'userid123', id: 'userid123', email: 'user@example.com' };

      const mockFindOne = jest.fn().mockResolvedValue(mockUser);
      const mockCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const mockLean = jest.fn().mockRejectedValue(new Error('Query failed'));
      (Watchlist.find as jest.Mock).mockReturnValue({ lean: mockLean });

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should convert symbols to strings', async () => {
      const mockUser = { _id: 'userid123', id: 'userid123', email: 'user@example.com' };
      const mockWatchlistItems = [
        { symbol: 123 }, // number
        { symbol: 'AAPL' }, // string
        { symbol: { toString: () => 'CONVERTED' } }, // object with toString
      ];

      const mockFindOne = jest.fn().mockResolvedValue(mockUser);
      const mockCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const mockLean = jest.fn().mockResolvedValue(mockWatchlistItems);
      (Watchlist.find as jest.Mock).mockReturnValue({ lean: mockLean });

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual(['123', 'AAPL', 'CONVERTED']);
    });

    it('should return empty array when no watchlist items found', async () => {
      const mockUser = { _id: 'userid123', id: 'userid123', email: 'user@example.com' };

      const mockFindOne = jest.fn().mockResolvedValue(mockUser);
      const mockCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const mockLean = jest.fn().mockResolvedValue([]);
      (Watchlist.find as jest.Mock).mockReturnValue({ lean: mockLean });

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual([]);
    });

    it('should handle user findOne error', async () => {
      const mockFindOne = jest.fn().mockRejectedValue(new Error('User query failed'));
      const mockCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getWatchlistSymbolsByEmail('user@example.com');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});