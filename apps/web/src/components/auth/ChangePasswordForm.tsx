import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth.store';
import { ChangePasswordDto } from '../../services/api/auth';

export const ChangePasswordForm: React.FC = () => {
  const [formData, setFormData] = useState<ChangePasswordDto>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<ChangePasswordDto>>({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { t } = useTranslation();
  
  const { 
    changePassword, 
    changePasswordLoading, 
    changePasswordError, 
    changePasswordSuccess,
    clearChangePasswordState 
  } = useAuthStore();

  // Clear success message after 3 seconds
  useEffect(() => {
    if (changePasswordSuccess) {
      const timer = setTimeout(() => {
        clearChangePasswordState();
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [changePasswordSuccess, clearChangePasswordState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ChangePasswordDto]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Clear global error when user starts typing
    if (changePasswordError) {
      clearChangePasswordState();
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ChangePasswordDto> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = t('auth.currentPasswordRequired');
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = t('auth.newPasswordRequired');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('auth.passwordMinLength');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.newPassword)) {
      newErrors.newPassword = t('auth.passwordStrength');
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await changePassword(formData);
    } catch (error) {
      // Error is handled by the store
      console.error('Password change failed:', error);
    }
  };

  return (
    <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 text-center">
        {t('auth.changePassword')}
      </h3>

      {changePasswordSuccess && (
        <div className="mt-4 rounded-md bg-success-50 dark:bg-success-900/20 p-4">
          <p className="text-sm text-success-800 dark:text-success-200">
            {t('auth.passwordChangedSuccessfully')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.currentPassword')}
          </label>
          <div className="relative">
            <input
              type={showPassword.current ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.currentPassword ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t('auth.currentPassword')}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword.current ? t('auth.hide') : t('auth.show')}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.newPassword')}
          </label>
          <div className="relative">
            <input
              type={showPassword.new ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.newPassword ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t('auth.newPassword')}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword.new ? t('auth.hide') : t('auth.show')}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.newPassword}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('auth.passwordRequirements')}
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative">
            <input
              type={showPassword.confirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.confirmPassword ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t('auth.confirmPassword')}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword.confirm ? t('auth.hide') : t('auth.show')}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.confirmPassword}</p>
          )}
        </div>

        {changePasswordError && (
          <div className="rounded-md bg-danger-50 dark:bg-danger-900/20 p-4">
            <p className="text-sm text-danger-800 dark:text-danger-200">{changePasswordError}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={changePasswordLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {changePasswordLoading ? t('common.loading') : t('auth.changePassword')}
          </button>
        </div>
      </form>
    </div>
  );
};