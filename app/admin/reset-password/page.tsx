'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  const validatePasswordStrength = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return true;
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Set the session with the tokens from URL
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError('Invalid or expired reset link');
          return;
        }
      }

      const { error } = await auth.updatePassword(data.password);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/login');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary p-4">
        <div className="bg-secondary p-8 rounded border border-theme w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Password Reset Successful</h1>
          <p className="text-primary mb-6">Your password has been updated successfully. You will be redirected to the login page shortly.</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full bg-primary text-secondary py-2 px-4 hover:bg-secondary hover:text-primary border border-theme transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="bg-secondary p-8 rounded border border-theme w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">Reset Password</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password', {
                required: 'Password is required',
                validate: validatePasswordStrength,
              })}
              className="w-full px-3 py-2 bg-primary border border-theme text-primary placeholder-secondary focus:outline-none focus:border-primary"
              placeholder="Enter new password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              className="w-full px-3 py-2 bg-primary border border-theme text-primary placeholder-secondary focus:outline-none focus:border-primary"
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-secondary py-2 px-4 hover:bg-secondary hover:text-primary border border-theme transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}