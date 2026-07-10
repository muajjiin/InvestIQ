import { getAllUsersForNewsEmail } from '../user.actions';

// Mock database connection
jest.mock('@/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

import { connectToDatabase } from '@/database/mongoose';

describe('User Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('getAllUsersForNewsEmail', () => {
    it('should fetch all users with email and name', async () => {
      const mockUsers = [
        { _id: '1', id: 'user1', email: 'user1@example.com', name: 'User One', country: 'US' },
        { _id: '2', id: 'user2', email: 'user2@example.com', name: 'User Two', country: 'UK' },
      ];

      const mockToArray = jest.fn().mockResolvedValue(mockUsers);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user1',
        email: 'user1@example.com',
        name: 'User One',
      });
      expect(result[1]).toEqual({
        id: 'user2',
        email: 'user2@example.com',
        name: 'User Two',
      });

      expect(mockCollection).toHaveBeenCalledWith('user');
      expect(mockFind).toHaveBeenCalledWith(
        { email: { $exists: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      );
    });

    it('should filter out users without email', async () => {
      const mockUsers = [
        { _id: '1', id: 'user1', email: 'user1@example.com', name: 'User One' },
        { _id: '2', id: 'user2', email: null, name: 'User Two' },
        { _id: '3', id: 'user3', name: 'User Three' },
      ];

      const mockToArray = jest.fn().mockResolvedValue(mockUsers);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user1');
    });

    it('should filter out users without name', async () => {
      const mockUsers = [
        { _id: '1', id: 'user1', email: 'user1@example.com', name: 'User One' },
        { _id: '2', id: 'user2', email: 'user2@example.com', name: null },
        { _id: '3', id: 'user3', email: 'user3@example.com' },
      ];

      const mockToArray = jest.fn().mockResolvedValue(mockUsers);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user1');
    });

    it('should use _id as fallback when id is missing', async () => {
      const mockUsers = [
        { _id: 'objectid123', email: 'user1@example.com', name: 'User One' },
      ];

      const mockToArray = jest.fn().mockResolvedValue(mockUsers);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('objectid123');
    });

    it('should handle _id with toString method', async () => {
      const mockUsers = [
        { 
          _id: { toString: () => 'converted-id' }, 
          email: 'user1@example.com', 
          name: 'User One' 
        },
      ];

      const mockToArray = jest.fn().mockResolvedValue(mockUsers);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('converted-id');
    });

    it('should return empty array when no users found', async () => {
      const mockToArray = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toEqual([]);
    });

    it('should return empty array on database connection error', async () => {
      (connectToDatabase as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      const result = await getAllUsersForNewsEmail();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should return empty array when db is null', async () => {
      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: null,
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toEqual([]);
    });

    it('should return empty array on collection query error', async () => {
      const mockFind = jest.fn().mockImplementation(() => {
        throw new Error('Query error');
      });
      const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle users with empty id gracefully', async () => {
      const mockUsers = [
        { _id: '', id: '', email: 'user1@example.com', name: 'User One' },
        { _id: null, id: null, email: 'user2@example.com', name: 'User Two' },
      ];

      const mockToArray = jest.fn().mockResolvedValue(mockUsers);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        connection: {
          db: {
            collection: mockCollection,
          },
        },
      });

      const result = await getAllUsersForNewsEmail();

      expect(result).toHaveLength(2);
      // Should use empty string as fallback
      expect(result[0].id).toBe('');
      expect(result[1].id).toBe('');
    });
  });
});