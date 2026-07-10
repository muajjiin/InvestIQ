import mongoose from 'mongoose';

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    Schema: jest.fn().mockImplementation(function(schema) {
      this.schema = schema;
      this.index = jest.fn();
      return this;
    }),
    model: jest.fn(),
    models: {},
  };
});

describe('Watchlist Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define schema with correct fields', () => {
      // Import after mocking
      require('../watchlist.model');

      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      expect(SchemaConstructor).toHaveBeenCalled();

      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      // Check field definitions
      expect(schemaDefinition.userId).toEqual({
        type: String,
        required: true,
        index: true,
      });
      
      expect(schemaDefinition.symbol).toEqual({
        type: String,
        required: true,
        uppercase: true,
        trim: true,
      });
      
      expect(schemaDefinition.company).toEqual({
        type: String,
        required: true,
        trim: true,
      });
      
      expect(schemaDefinition.addedAt).toEqual({
        type: Date,
        default: Date.now,
      });
    });

    it('should configure schema options correctly', () => {
      require('../watchlist.model');

      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaOptions = SchemaConstructor.mock.calls[0][1];
      
      expect(schemaOptions).toEqual({ timestamps: false });
    });

    it('should create compound index for userId and symbol', () => {
      require('../watchlist.model');

      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaInstance = SchemaConstructor.mock.instances[0];
      
      expect(schemaInstance.index).toHaveBeenCalledWith(
        { userId: 1, symbol: 1 },
        { unique: true }
      );
    });
  });

  describe('Model Export', () => {
    it('should export Watchlist model', () => {
      const { Watchlist } = require('../watchlist.model');
      expect(Watchlist).toBeDefined();
    });

    it('should reuse existing model if available', () => {
      // Set up existing model
      const existingModel = { name: 'ExistingWatchlist' };
      (mongoose.models as any).Watchlist = existingModel;

      // Clear require cache
      jest.resetModules();
      
      const { Watchlist } = require('../watchlist.model');
      expect(Watchlist).toBe(existingModel);
    });
  });

  describe('Field Validation', () => {
    it('should require userId field', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      expect(schemaDefinition.userId.required).toBe(true);
    });

    it('should require symbol field', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      expect(schemaDefinition.symbol.required).toBe(true);
    });

    it('should require company field', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      expect(schemaDefinition.company.required).toBe(true);
    });

    it('should uppercase symbol field', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      expect(schemaDefinition.symbol.uppercase).toBe(true);
    });

    it('should trim symbol field', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      expect(schemaDefinition.symbol.trim).toBe(true);
    });

    it('should trim company field', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      expect(schemaDefinition.company.trim).toBe(true);
    });

    it('should have default value for addedAt field', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      expect(schemaDefinition.addedAt.default).toBe(Date.now);
    });
  });

  describe('Index Configuration', () => {
    it('should create index on userId for query performance', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaDefinition = SchemaConstructor.mock.calls[0][0];
      
      expect(schemaDefinition.userId.index).toBe(true);
    });

    it('should prevent duplicate symbols per user with unique compound index', () => {
      require('../watchlist.model');
      const SchemaConstructor = mongoose.Schema as jest.MockedClass<typeof mongoose.Schema>;
      const schemaInstance = SchemaConstructor.mock.instances[0];
      
      const indexCall = (schemaInstance.index as jest.Mock).mock.calls[0];
      expect(indexCall[1].unique).toBe(true);
    });
  });
});