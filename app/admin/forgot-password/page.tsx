'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { auth } from '@/lib/auth';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await auth.resetPassword(data.email);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
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
          <h1 className="text-2xl font-bold text-primary mb-4">Check Your Email</h1>
          <p className="text-primary mb-6">
            If an account with that email exists, we've sent you a password reset link.
            Please check your email and follow the instructions.
          </p>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full bg-primary text-secondary py-2 px-4 hover:bg-secondary hover:text-primary border border-theme transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="bg-secondary p-8 rounded border border-theme w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">Forgot Password</h1>
        <p className="text-primary mb-6 text-center text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full px-3 py-2 bg-primary border border-theme text-primary placeholder-secondary focus:outline-none focus:border-primary"
              placeholder="admin@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
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
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/admin/login')}
              className="text-primary hover:text-secondary transition-colors text-sm"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}