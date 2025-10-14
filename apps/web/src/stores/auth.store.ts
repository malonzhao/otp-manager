import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthTokens } from '@otp-manager/shared/types';
import { authService, AuthService, ChangePasswordDto } from '../services/api/auth';
import { LoginDto, RegisterDto } from '../services/api/dto/auth.dto';
import i18n from '../i18n';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: AuthTokens | null;
  changePasswordLoading: boolean;
  changePasswordError: string | null;
  changePasswordSuccess: boolean;
  
  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  register: (credentials: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  changePassword: (changePasswordDto: ChangePasswordDto) => Promise<void>;
  clearError: () => void;
  clearChangePasswordState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokens: null,
      changePasswordLoading: false,
      changePasswordError: null,
      changePasswordSuccess: false,

      login: async (credentials: LoginDto) => {
        set({ isLoading: true, error: null });
        try {
          const tokens = await authService.login(credentials);
          AuthService.setTokens(tokens);
          set({ 
            tokens, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || i18n.t('auth.loginFailed'),
            isLoading: false
          });
          throw error;
        }
      },

      register: async (credentials: RegisterDto) => {
        set({ isLoading: true, error: null });
        try {
          const tokens = await authService.register(credentials);
          AuthService.setTokens(tokens);
          set({ 
            tokens, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || i18n.t('auth.registerFailed'),
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const tokens = get().tokens;
          if (tokens?.refreshToken) {
            await authService.logout(tokens.refreshToken);
          }
          AuthService.clearTokens();
          set({ 
            tokens: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch (error: any) {
          // Even if logout API fails, clear local state
          AuthService.clearTokens();
          set({ 
            tokens: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      refreshToken: async () => {
        const tokens = get().tokens;
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const newTokens = await authService.refresh(tokens.refreshToken);
          AuthService.setTokens(newTokens);
          set({ tokens: newTokens });
        } catch (error: any) {
          // Refresh failed, clear tokens and mark as not authenticated
          AuthService.clearTokens();
          set({ 
            tokens: null, 
            isAuthenticated: false,
            error: i18n.t('auth.sessionExpired')
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      changePassword: async (changePasswordDto: ChangePasswordDto) => {
        set({
          changePasswordLoading: true,
          changePasswordError: null,
          changePasswordSuccess: false
        });
        try {
          await authService.changePassword(changePasswordDto);
          set({
            changePasswordLoading: false,
            changePasswordSuccess: true
          });
        } catch (error: any) {
          set({
            changePasswordError: error.response?.data?.message || i18n.t('errors.changePasswordFailed'),
            changePasswordLoading: false
          });
          throw error;
        }
      },

      clearChangePasswordState: () => set({
        changePasswordError: null,
        changePasswordSuccess: false
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state from localStorage
export const initializeAuthState = () => {
  const tokens = AuthService.getTokens();
  useAuthStore.setState({ 
    tokens, 
    isAuthenticated: !!tokens 
  });
};