import { UserRepository } from '../../repositories/user.repository';
import { Collection, Db, MongoClient, WithId, ObjectId } from 'mongodb';
import Database from '../../config/database';
import { UserRole, UserStatus, IUser } from '../../types';

// Mock the Database class and MongoDB ObjectId
jest.mock('../../config/database', () => {
  return {
    __esModule: true,
    default: {
      getInstance: jest.fn().mockReturnValue({
        getDb: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn()
      })
    }
  };
});

// Mock ObjectId
jest.mock('mongodb', () => {
  const originalModule = jest.requireActual('mongodb');
  return {
    ...originalModule,
    ObjectId: jest.fn().mockImplementation((id) => {
      return { toString: () => id || 'mockedObjectId' };
    })
  };
});

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockCollection: jest.Mocked<Collection<IUser>>;
  let mockDb: jest.Mocked<Db>;

  beforeEach(() => {
    // Create mock collection
    mockCollection = {
      findOne: jest.fn(),
      find: jest.fn(),
      insertOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn()
    } as unknown as jest.Mocked<Collection<IUser>>;

    // Create mock db
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    } as unknown as jest.Mocked<Db>;

    // Configure the mock Database
    const mockDatabaseInstance = Database.getInstance();
    (mockDatabaseInstance.getDb as jest.Mock).mockResolvedValue(mockDb);

    // Create repository instance
    userRepository = new UserRepository();
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const mockUser: WithId<IUser> = {
        _id: 'user123' as any,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.CLAIMANT,
        status: UserStatus.ACTIVE,
        lastLogin: new Date(),
        isDeleted: false
      };

      // Setup mock
      (mockCollection.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Call method
      const result = await userRepository.findByEmail('test@example.com');

      // Assertions
      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Setup mock
      (mockCollection.findOne as jest.Mock).mockResolvedValue(null);

      // Call method
      const result = await userRepository.findByEmail('nonexistent@example.com');

      // Assertions
      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(result).toBeNull();
    });
  });

  describe('findManagers', () => {
    it('should find all managers', async () => {
      const mockManagers: WithId<IUser>[] = [
        {
          _id: 'manager1' as any,
          name: 'Manager 1',
          email: 'manager1@example.com',
          password: 'hashedPassword',
          role: UserRole.MANAGER,
          status: UserStatus.ACTIVE,
          lastLogin: new Date(),
          isDeleted: false
        },
        {
          _id: 'manager2' as any,
          name: 'Manager 2',
          email: 'manager2@example.com',
          password: 'hashedPassword',
          role: UserRole.MANAGER,
          status: UserStatus.ACTIVE,
          lastLogin: new Date(),
          isDeleted: false
        }
      ];

      // Mock the find method
      const mockFindCursor = {
        toArray: jest.fn().mockResolvedValue(mockManagers)
      };
      (mockCollection.find as jest.Mock).mockReturnValue(mockFindCursor);

      // Call method
      const result = await userRepository.findManagers();

      // Assertions
      expect(mockCollection.find).toHaveBeenCalledWith({
        role: UserRole.MANAGER,
        isDeleted: false
      });
      expect(result).toEqual(mockManagers);
    });
  });

  describe('findManagersByProvider', () => {
    it('should find managers by provider id', async () => {
      const providerId = 'provider123';
      const mockManagers: WithId<IUser>[] = [
        {
          _id: 'manager1' as any,
          name: 'Manager 1',
          email: 'manager1@example.com',
          password: 'hashedPassword',
          role: UserRole.MANAGER,
          providerId,
          status: UserStatus.ACTIVE,
          lastLogin: new Date(),
          isDeleted: false
        }
      ];

      // Mock the find method
      const mockFindCursor = {
        toArray: jest.fn().mockResolvedValue(mockManagers)
      };
      (mockCollection.find as jest.Mock).mockReturnValue(mockFindCursor);

      // Call method
      const result = await userRepository.findManagersByProvider(providerId);

      // Assertions
      expect(mockCollection.find).toHaveBeenCalledWith({
        role: UserRole.MANAGER,
        providerId,
        isDeleted: false
      });
      expect(result).toEqual(mockManagers);
    });
  });

  describe('findClaimants', () => {
    it('should find all claimants', async () => {
      const mockClaimants: WithId<IUser>[] = [
        {
          _id: 'claimant1' as any,
          name: 'Claimant 1',
          email: 'claimant1@example.com',
          password: 'hashedPassword',
          role: UserRole.CLAIMANT,
          status: UserStatus.ACTIVE,
          lastLogin: new Date(),
          isDeleted: false
        },
        {
          _id: 'claimant2' as any,
          name: 'Claimant 2',
          email: 'claimant2@example.com',
          password: 'hashedPassword',
          role: UserRole.CLAIMANT,
          status: UserStatus.ACTIVE,
          lastLogin: new Date(),
          isDeleted: false
        }
      ];

      // Mock the find method
      const mockFindCursor = {
        toArray: jest.fn().mockResolvedValue(mockClaimants)
      };
      (mockCollection.find as jest.Mock).mockReturnValue(mockFindCursor);

      // Call method
      const result = await userRepository.findClaimants();

      // Assertions
      expect(mockCollection.find).toHaveBeenCalledWith({
        role: UserRole.CLAIMANT,
        isDeleted: false
      });
      expect(result).toEqual(mockClaimants);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      // Crear un ID que podamos controlar como string, pero que el mock de ObjectId usará
      const userId = '507f1f77bcf86cd799439011'; // 24 caracteres hexadecimales válidos
      const mockUser: WithId<IUser> = {
        _id: userId as any,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.CLAIMANT,
        status: UserStatus.ACTIVE,
        lastLogin: new Date(),
        isDeleted: false
      };

      // Mock the findOneAndUpdate method
      (mockCollection.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Call method
      const result = await userRepository.updateLastLogin(userId);

      // Assertions
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: expect.any(Object) }),
        expect.objectContaining({ $set: { lastLogin: expect.any(Date) } }),
        { returnDocument: 'after' }
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('exists', () => {
    it('should return true if user exists', async () => {
      const email = 'existing@example.com';
      
      // Mock the countDocuments method
      (mockCollection.countDocuments as jest.Mock).mockResolvedValue(1);

      // Call method
      const result = await userRepository.exists(email);

      // Assertions
      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        email,
        isDeleted: false
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      const email = 'nonexistent@example.com';
      
      // Mock the countDocuments method
      (mockCollection.countDocuments as jest.Mock).mockResolvedValue(0);

      // Call method
      const result = await userRepository.exists(email);

      // Assertions
      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        email,
        isDeleted: false
      });
      expect(result).toBe(false);
    });
  });
}); 