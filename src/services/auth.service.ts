import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { ProviderRepository } from '../repositories/provider.repository';
import { IUser, UserRole, UserStatus } from '../types';
import { RegisterUserDTO, LoginResponse } from '../types/auth';

export class AuthService {
  private userRepository: UserRepository;
  private providerRepository: ProviderRepository;
  private readonly SALT_ROUNDS = 10;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  constructor() {
    this.userRepository = new UserRepository();
    this.providerRepository = new ProviderRepository();
  }

  async register(userData: RegisterUserDTO): Promise<IUser> {
    // Verify if the user already exists
    const existingUser = await this.userRepository.exists(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // If the user is a manager, verify that the provider exists
    if (userData.role === UserRole.MANAGER && userData.providerId) {
      const provider = await this.providerRepository.findById(userData.providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    // Create the user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      lastLogin: new Date(),
      isDeleted: false
    });

    return user;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    // Find the user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify status
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('User is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user._id!.toString());

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id!.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        providerId: user.providerId
      }
    };
  }

  private generateToken(user: IUser): string {
    return jwt.sign(
      {
        id: user._id!.toString(),
        email: user.email,
        role: user.role,
        providerId: user.providerId
      },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  async validateToken(token: string): Promise<{
    id: string;
    email: string;
    role: UserRole;
    providerId?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as {
        id: string;
        email: string;
        role: UserRole;
        providerId?: string;
      };

      const user = await this.userRepository.findById(decoded.id);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error('Invalid token');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}