import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { ProviderRepository } from '../../repositories/provider.repository';
import { UserRole, UserStatus } from '../../types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the repositories and dependencies
jest.mock('../../repositories/user.repository');
jest.mock('../../repositories/provider.repository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  // Variables para guardar las instancias de mock creadas en el constructor
  let mockUserRepo: any;
  let mockProviderRepo: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reinstantiate the class to reset our injected mocks
    const originalUserRepoPrototype = UserRepository.prototype;
    const originalProviderRepoPrototype = ProviderRepository.prototype;
    
    // Save original prototype functions to restore later
    const originalExists = UserRepository.prototype.exists;
    const originalCreate = UserRepository.prototype.create;
    const originalFindByEmail = UserRepository.prototype.findByEmail;
    const originalUpdateLastLogin = UserRepository.prototype.updateLastLogin;
    const originalFindById = UserRepository.prototype.findById;
    const originalProviderFindById = ProviderRepository.prototype.findById;
    
    // Reset the implementations
    UserRepository.prototype.exists = jest.fn();
    UserRepository.prototype.create = jest.fn();
    UserRepository.prototype.findByEmail = jest.fn();
    UserRepository.prototype.updateLastLogin = jest.fn();
    UserRepository.prototype.findById = jest.fn();
    ProviderRepository.prototype.findById = jest.fn();
    
    // Create a new instance of AuthService
    authService = new AuthService();
    
    // Store the instances created within AuthService constructor
    mockUserRepo = UserRepository.prototype;
    mockProviderRepo = ProviderRepository.prototype;
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      // Mock the necessary methods
      mockUserRepo.exists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CLAIMANT,
        status: UserStatus.ACTIVE,
        lastLogin: new Date(),
        isDeleted: false
      });
      
      // Mock bcrypt
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Prepare the input data
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.CLAIMANT
      };

      // Call the method
      const result = await authService.register(userData);

      // Assertions
      expect(mockUserRepo.exists).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        ...userData,
        password: 'hashedPassword',
        status: UserStatus.ACTIVE,
        lastLogin: expect.any(Date),
        isDeleted: false
      });
      expect(result).toEqual({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CLAIMANT,
        status: UserStatus.ACTIVE,
        lastLogin: expect.any(Date),
        isDeleted: false
      });
    });

    it('should throw an error if user already exists', async () => {
      // Mock the necessary methods
      mockUserRepo.exists.mockResolvedValue(true);

      // Prepare the input data
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.CLAIMANT
      };

      // Call the method and expect it to throw
      await expect(authService.register(userData)).rejects.toThrow('User already exists');
      expect(mockUserRepo.exists).toHaveBeenCalledWith('existing@example.com');
    });

    it('should verify provider exists for manager role', async () => {
      // Mock the necessary methods
      mockUserRepo.exists.mockResolvedValue(false);
      mockProviderRepo.findById.mockResolvedValue({ _id: 'provider123', name: 'Test Provider' });
      mockUserRepo.create.mockResolvedValue({
        _id: 'user123',
        name: 'Manager User',
        email: 'manager@example.com',
        role: UserRole.MANAGER,
        providerId: 'provider123',
        status: UserStatus.ACTIVE,
        lastLogin: expect.any(Date),
        isDeleted: false
      });
      
      // Mock bcrypt
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Prepare the input data
      const userData = {
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'password123',
        role: UserRole.MANAGER,
        providerId: 'provider123'
      };

      // Call the method
      const result = await authService.register(userData);

      // Assertions
      expect(mockUserRepo.exists).toHaveBeenCalledWith('manager@example.com');
      expect(mockProviderRepo.findById).toHaveBeenCalledWith('provider123');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        ...userData,
        password: 'hashedPassword',
        status: UserStatus.ACTIVE,
        lastLogin: expect.any(Date),
        isDeleted: false
      });
      expect(result).toEqual({
        _id: 'user123',
        name: 'Manager User',
        email: 'manager@example.com',
        role: UserRole.MANAGER,
        providerId: 'provider123',
        status: UserStatus.ACTIVE,
        lastLogin: expect.any(Date),
        isDeleted: false
      });
    });

    it('should throw an error if provider not found for manager role', async () => {
      // Mock the necessary methods
      mockUserRepo.exists.mockResolvedValue(false);
      mockProviderRepo.findById.mockResolvedValue(null);

      // Prepare the input data
      const userData = {
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'password123',
        role: UserRole.MANAGER,
        providerId: 'provider123'
      };

      // Call the method and expect it to throw
      await expect(authService.register(userData)).rejects.toThrow('Provider not found');
      expect(mockUserRepo.exists).toHaveBeenCalledWith('manager@example.com');
      expect(mockProviderRepo.findById).toHaveBeenCalledWith('provider123');
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.CLAIMANT,
        status: UserStatus.ACTIVE,
        lastLogin: new Date(),
        isDeleted: false
      };

      // Mock the necessary methods
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockUserRepo.updateLastLogin.mockResolvedValue(mockUser);
      
      // Mock bcrypt compare
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      // Mock jwt sign
      (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

      // Call the method
      const result = await authService.login('test@example.com', 'password123');

      // Assertions
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockUserRepo.updateLastLogin).toHaveBeenCalledWith('user123');
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        token: 'fake-jwt-token',
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          role: UserRole.CLAIMANT
        }
      });
    });

    it('should throw an error if user not found', async () => {
      // Mock the method to return null (user not found)
      mockUserRepo.findByEmail.mockResolvedValue(null);

      // Call the method and expect it to throw
      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow('Invalid credentials');
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });

    it('should throw an error if user is not active', async () => {
      // Mock user with inactive status
      const mockUser = {
        _id: 'user123',
        name: 'Inactive User',
        email: 'inactive@example.com',
        password: 'hashedPassword',
        role: UserRole.CLAIMANT,
        status: UserStatus.INACTIVE,
        lastLogin: new Date(),
        isDeleted: false
      };

      // Mock the method
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      // Call the method and expect it to throw
      await expect(authService.login('inactive@example.com', 'password123')).rejects.toThrow('User is not active');
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('inactive@example.com');
    });

    it('should throw an error if password is invalid', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.CLAIMANT,
        status: UserStatus.ACTIVE,
        lastLogin: new Date(),
        isDeleted: false
      };

      // Mock the methods
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      
      // Mock bcrypt compare to return false (invalid password)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Call the method and expect it to throw
      await expect(authService.login('test@example.com', 'wrongPassword')).rejects.toThrow('Invalid credentials');
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
    });
  });

  describe('validateToken', () => {
    it('should validate a token successfully', async () => {
      // Mock decoded token
      const mockDecodedToken = {
        id: 'user123',
        email: 'test@example.com',
        role: UserRole.CLAIMANT
      };

      // Mock user
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.CLAIMANT,
        status: UserStatus.ACTIVE,
        lastLogin: new Date(),
        isDeleted: false
      };

      // Mock the methods
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      mockUserRepo.findById.mockResolvedValue(mockUser);

      // Call the method
      const result = await authService.validateToken('fake-token');

      // Assertions
      expect(jwt.verify).toHaveBeenCalled();
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockDecodedToken);
    });

    it('should throw an error if token verification fails', async () => {
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Call the method and expect it to throw
      await expect(authService.validateToken('invalid-token')).rejects.toThrow('Invalid token');
      expect(jwt.verify).toHaveBeenCalled();
    });

    it('should throw an error if user not found or inactive', async () => {
      // Mock decoded token
      const mockDecodedToken = {
        id: 'user123',
        email: 'test@example.com',
        role: UserRole.CLAIMANT
      };

      // Mock the methods
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      
      // Case 1: User not found
      mockUserRepo.findById.mockResolvedValue(null);

      // Call the method and expect it to throw
      await expect(authService.validateToken('fake-token')).rejects.toThrow('Invalid token');
      expect(jwt.verify).toHaveBeenCalled();
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user123');

      // Case 2: User is inactive
      const mockInactiveUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.CLAIMANT,
        status: UserStatus.INACTIVE,
        lastLogin: new Date(),
        isDeleted: false
      };

      mockUserRepo.findById.mockResolvedValue(mockInactiveUser);

      // Call the method and expect it to throw
      await expect(authService.validateToken('fake-token')).rejects.toThrow('Invalid token');
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user123');
    });
  });
}); 