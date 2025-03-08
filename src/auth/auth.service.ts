import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        username: dto.email,
      },
    });

    const authToken = this.jwtService.sign(
      {
        sub: user.uid,
        email: user.username,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      },
    );

    return {
      authToken,
    };
  }

  async login(dto: LoginDto) {
    try {
      // Validate input
      if (!dto.username || !dto.password) {
        throw new UnauthorizedException('Username and password are required');
      }

      // Find the user by username
      const user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      // Check if the user exists
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify the password
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const authToken = this.jwtService.sign(
        {
          sub: user.uid,
          email: user.username,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
        },
      );

      return {
        authToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw the UnauthorizedException
      }

      throw new InternalServerErrorException('An error occurred during login');
    }
  }
}
