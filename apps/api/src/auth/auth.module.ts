import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma.module';
import { I18nModule } from '../i18n/i18n.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
    I18nModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}