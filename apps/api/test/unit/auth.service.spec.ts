import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "../../src/auth/auth.service";
import { AuthRepository } from "../../src/auth/auth.repository";
import { LoginDto } from "../../src/auth/dto/login.dto";
import { RegisterDto } from "../../src/auth/dto/register.dto";
import { TokensDto } from "../../src/auth/dto/tokens.dto";

// Mock the bcrypt module
jest.mock("bcrypt");

// Mock the AuthRepository
const mockAuthRepository = {
  findUserByEmail: jest.fn(),
  findUserByUsername: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
  updateRefreshToken: jest.fn(),
};

// Mock the JwtService
const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe("AuthService", () => {
  let authService: AuthService;
  let authRepository: AuthRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepository = module.get<AuthRepository>(AuthRepository);
    jwtService = module.get<JwtService>(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "password123",
    };

    const mockUser = {
      id: "1",
      email: "test@example.com",
      password: "hashedPassword",
      username: "testuser",
    };

    const mockTokens: TokensDto = {
      accessToken: "accessToken",
      refreshToken: "refreshToken",
    };

    it("should login successfully with valid credentials", async () => {
      // Mock the repository to return a user
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);
      // Mock bcrypt to return true for password comparison
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      // Mock the generateTokens method (private method, so we mock the jwtService.sign)
      mockJwtService.sign.mockReturnValueOnce("accessToken");
      mockJwtService.sign.mockReturnValueOnce("refreshToken");
      // Mock the updateRefreshToken method
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login(loginDto);

      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        "refreshToken",
      );
      expect(result).toEqual(mockTokens);
    });

    it("should throw UnauthorizedException if user not found", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    };

    const mockUser = {
      id: "1",
      email: "test@example.com",
      username: "testuser",
      password: "hashedPassword",
    };

    const mockTokens: TokensDto = {
      accessToken: "accessToken",
      refreshToken: "refreshToken",
    };

    it("should register successfully with new user", async () => {
      // Mock no existing user with email or username
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.findUserByUsername.mockResolvedValue(null);
      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      // Mock createUser
      mockAuthRepository.createUser.mockResolvedValue(mockUser);
      // Mock jwtService.sign for tokens
      mockJwtService.sign.mockReturnValueOnce("accessToken");
      mockJwtService.sign.mockReturnValueOnce("refreshToken");
      // Mock updateRefreshToken
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.register(registerDto);

      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(authRepository.findUserByUsername).toHaveBeenCalledWith(
        registerDto.username,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(authRepository.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        username: registerDto.username,
        password: "hashedPassword",
      });
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        "refreshToken",
      );
      expect(result).toEqual(mockTokens);
    });

    it("should throw ConflictException if email already exists", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(authRepository.findUserByUsername).not.toHaveBeenCalled();
    });

    it("should throw ConflictException if username already exists", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.findUserByUsername.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(authRepository.findUserByUsername).toHaveBeenCalledWith(
        registerDto.username,
      );
    });
  });

  describe("refreshToken", () => {
    const refreshToken = "validRefreshToken";
    const payload = {
      sub: "1",
      email: "test@example.com",
      username: "testuser",
    };

    const mockUser = {
      id: "1",
      email: "test@example.com",
      username: "testuser",
      refreshToken: "validRefreshToken",
    };

    const mockTokens: TokensDto = {
      accessToken: "newAccessToken",
      refreshToken: "newRefreshToken",
    };

    it("should refresh tokens successfully with valid refresh token", async () => {
      // Mock jwtService.verify to return payload
      mockJwtService.verify.mockReturnValue(payload);
      // Mock findUserById to return user with matching refresh token
      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      // Mock jwtService.sign for new tokens
      mockJwtService.sign.mockReturnValueOnce("newAccessToken");
      mockJwtService.sign.mockReturnValueOnce("newRefreshToken");
      // Mock updateRefreshToken
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshToken(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
      });
      expect(authRepository.findUserById).toHaveBeenCalledWith(payload.sub);
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        "newRefreshToken",
      );
      expect(result).toEqual(mockTokens);
    });

    it("should throw UnauthorizedException if refresh token is invalid", async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.refreshToken("invalidToken")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if user not found", async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockAuthRepository.findUserById.mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if refresh token does not match", async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockAuthRepository.findUserById.mockResolvedValue({
        ...mockUser,
        refreshToken: "differentToken",
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("logout", () => {
    const refreshToken = "validRefreshToken";
    const payload = {
      sub: "1",
      email: "test@example.com",
      username: "testuser",
    };

    it("should logout successfully with valid refresh token", async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      await authService.logout(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
      });
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        payload.sub,
        null,
      );
    });

    it("should not throw error if refresh token is invalid", async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.logout("invalidToken")).resolves.not.toThrow();
      expect(authRepository.updateRefreshToken).not.toHaveBeenCalled();
    });
  });
});
