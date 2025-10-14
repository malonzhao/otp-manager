import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { TokensDto } from "./dto/tokens.dto";
import { TokenPayload } from "./interfaces/token-payload.interface";
import { I18nService } from "../i18n/i18n.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly i18nService: I18nService,
  ) {}

  async login(loginDto: LoginDto, language?: string): Promise<TokensDto> {
    const user = await this.authRepository.findUserByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException(
        this.i18nService.translate("auth.invalid_credentials", language),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18nService.translate("auth.invalid_credentials", language),
      );
    }

    const tokens = await this.generateTokens(user);
    await this.authRepository.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async register(
    registerDto: RegisterDto,
    language?: string,
  ): Promise<TokensDto> {
    const existingUser = await this.authRepository.findUserByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException(
        this.i18nService.translate("auth.email_already_exists", language),
      );
    }

    const existingUsername = await this.authRepository.findUserByUsername(
      registerDto.username,
    );
    if (existingUsername) {
      throw new ConflictException(
        this.i18nService.translate("auth.email_already_exists", language),
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.authRepository.createUser({
      email: registerDto.email,
      username: registerDto.username,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user);
    await this.authRepository.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshToken(
    refreshToken: string,
    language?: string,
  ): Promise<TokensDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
      }) as TokenPayload;

      const user = await this.authRepository.findUserById(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException(
          this.i18nService.translate("auth.invalid_token", language),
        );
      }

      const tokens = await this.generateTokens(user);
      await this.authRepository.updateRefreshToken(
        user.id,
        tokens.refreshToken,
      );

      return tokens;
    } catch (error) {
      throw new UnauthorizedException(
        this.i18nService.translate("auth.invalid_token", language),
      );
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
      }) as TokenPayload;

      await this.authRepository.updateRefreshToken(payload.sub, null);
    } catch (error) {
      // Silent logout even if token is invalid
    }
  }

  private async generateTokens(user: any): Promise<TokensDto> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
      expiresIn: "7d",
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
