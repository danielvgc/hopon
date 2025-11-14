// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// Import global CSS for Next.js (side-effect)
// @ts-ignore: allow side-effect CSS import without type declarations
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HopOn - Find & Join Pickup Sports Games',
  description: 'Discover, organize, and join local pickup sports games with HopOn',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
