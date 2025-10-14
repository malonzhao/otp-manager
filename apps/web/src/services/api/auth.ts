import { apiClient } from './client';
import { AuthTokens } from '@otp-manager/shared/types';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export class AuthService {
  async login(loginDto: LoginDto): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/login', loginDto);
  }

  async register(registerDto: RegisterDto): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/register', registerDto);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
  }

  async logout(refreshToken: string): Promise<void> {
    return apiClient.post<void>('/auth/logout', { refreshToken });
  }

  async getCurrentUser(): Promise<any> {
    // This will be implemented once we have user profile endpoint
    throw new Error('Not implemented yet');
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<ChangePasswordResponse> {
    return apiClient.patch<ChangePasswordResponse>('/users/change-password', changePasswordDto);
  }

  // Helper methods for token management
  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  static getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  static clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();