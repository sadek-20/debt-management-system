import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn: SignOptions['expiresIn'];
  private readonly refreshTokenExpiresIn: SignOptions['expiresIn'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiresIn = this.configService.get<SignOptions['expiresIn']>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
    this.refreshTokenExpiresIn = this.configService.get<SignOptions['expiresIn']>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
  }

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const encodedPassword = await hash(dto.password, 10);

    try {
      const business = await this.prisma.business.create({
        data: {
          name: dto.businessName,
          ownerName: dto.ownerName,
          phone: dto.phone,
          isActive: true,
          users: {
            create: {
              fullName: dto.ownerName,
              phone: dto.phone,
              password: encodedPassword,
              role: 'OWNER',
              isActive: true,
            },
          },
        },
        include: {
          users: true,
        },
      });

      const owner = business.users[0];
      return this.generateTokens(owner.id, owner.phone, owner.role, business.id);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'name' in error &&
        (error as any).name === 'PrismaClientKnownRequestError' &&
        (error as any).code === 'P2002'
      ) {
        throw new ConflictException('Phone number is already registered');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByPhone(dto.phone);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.phone, user.role, user.businessId);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    return this.generateTokens(user.id, user.phone, user.role, user.businessId);
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Refresh token is invalid');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }

  private async generateTokens(
    userId: string,
    phone: string,
    role: string,
    businessId: string,
  ): Promise<AuthTokens> {
    const accessTokenPayload: JwtPayload = {
      sub: userId,
      phone,
      role,
      businessId,
      type: 'access',
    };

    const refreshTokenPayload: JwtPayload = {
      sub: userId,
      phone,
      role,
      businessId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.refreshTokenExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
