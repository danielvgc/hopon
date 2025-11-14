// frontend/src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const error = searchParams.get('error');

      if (error) {
        console.error('Auth error:', error);
        router.push('/login?error=auth_failed');
        return;
      }

      if (accessToken && refreshToken) {
        try {
          await login(accessToken, refreshToken);
          router.push('/discover');
        } catch (error) {
          console.error('Login failed:', error);
          router.push('/login?error=login_failed');
        }
      } else {
        router.push('/login?error=missing_tokens');
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="spinner w-12 h-12 border-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Logging you in...</p>
      </div>
    </div>
  );
}
