import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { SellerLoginDto } from './dto/seller-login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ success: boolean; expiresIn: number }> {
    const rateKey = `otp_rate:${dto.phone}`;
    const count = await this.redis.get(rateKey);

    if (count !== null && parseInt(count, 10) >= 3) {
      throw new HttpException(
        "Juda ko'p urinish. 10 daqiqa kuting",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();

    await this.redis.set(`otp:${dto.phone}`, otp, 300);
    await this.redis.incr(rateKey);
    await this.redis.expire(rateKey, 600);

    if (this.config.get<string>('NODE_ENV') === 'development') {
      console.log(`\n🔑 OTP for ${dto.phone}: ${otp}\n`);
    } else {
      // TODO: POST https://notify.eskiz.uz/api/message/sms/send
    }

    return { success: true, expiresIn: 300 };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const storedOtp = await this.redis.get(`otp:${dto.phone}`);

    if (storedOtp === null) {
      throw new HttpException(
        'OTP muddati tugagan yoki yuborilmagan',
        HttpStatus.BAD_REQUEST,
      );
    }

    const failsKey = `otp_fails:${dto.phone}`;
    const fails = await this.redis.get(failsKey);
    if (fails !== null && parseInt(fails, 10) >= 5) {
      throw new HttpException(
        "Juda ko'p noto'g'ri urinish",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (storedOtp !== dto.otp) {
      await this.redis.incr(failsKey);
      await this.redis.expire(failsKey, 300);
      throw new HttpException("Noto'g'ri OTP", HttpStatus.BAD_REQUEST);
    }

    await Promise.all([
      this.redis.del(`otp:${dto.phone}`),
      this.redis.del(failsKey),
      this.redis.del(`otp_rate:${dto.phone}`),
    ]);

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      create: {
        phone: dto.phone,
        referralCode: randomBytes(4).toString('hex').toUpperCase(),
      },
      update: {},
    });

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        loyaltyCoins: user.loyaltyCoins,
      },
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        role: { in: [Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR] },
      },
    });

    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new HttpException('Email yoki parol noto\'g\'ri', HttpStatus.UNAUTHORIZED);
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async sellerLogin(dto: SellerLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        phone: dto.phone,
        role: { in: [Role.SELLER, Role.WAREHOUSE] },
      },
    });

    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new HttpException('Telefon yoki parol noto\'g\'ri', HttpStatus.UNAUTHORIZED);
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: { sub: string; type: string; role?: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new HttpException('Token yaroqsiz', HttpStatus.UNAUTHORIZED);
    }

    if (payload.type !== 'refresh') {
      throw new HttpException("Token turi noto'g'ri", HttpStatus.UNAUTHORIZED);
    }

    const stored = await this.redis.get(`session:${payload.sub}`);
    if (!stored) {
      throw new HttpException('Sessiya tugagan, qayta kiring', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new HttpException('Foydalanuvchi topilmadi', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' },
    );

    return { accessToken };
  }

  async logout(userId: string): Promise<{ success: boolean }> {
    await this.redis.del(`session:${userId}`);
    return { success: true };
  }

  private async generateTokens(user: { id: string; role: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, role: user.role },
        { expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: user.id, type: 'refresh' },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    await this.redis.set(`session:${user.id}`, refreshToken, 7 * 24 * 3600);

    return { accessToken, refreshToken };
  }
}
