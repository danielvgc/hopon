// frontend/src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/discover');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12 border-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-green-500">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-6 text-white">
            🏀 HopOn
          </h1>
          <p className="text-2xl mb-8 text-blue-50">
            Find & Join Pickup Sports Games Near You
          </p>
          <p className="text-lg mb-12 text-blue-100 max-w-2xl mx-auto">
            Connect with local athletes, discover games in your area, and never miss an opportunity to play your favorite sports.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="btn btn-primary bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
              Get Started
            </Link>
            <a href="#features" className="btn btn-outline border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
              Learn More
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold mb-2">Discover Games</h3>
            <p className="text-gray-600">
              Find pickup games near you with real-time location-based search and filters.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Connect</h3>
            <p className="text-gray-600">
              Meet new players, build your network, and form lasting sports friendships.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Real-time Updates</h3>
            <p className="text-gray-600">
              Get instant notifications when games fill up or when someone joins your event.
            </p>
          </div>
        </div>

        {/* Sports Icons */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Popular Sports</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {['🏀', '⚽', '🎾', '🏸', '🏐', '⚾', '🏈', '🏒', '🏓', '🏏'].map((icon, i) => (
              <div key={i} className="card w-20 h-20 flex items-center justify-center text-4xl hover:scale-110 transition-transform">
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="card p-12 bg-white/10 backdrop-blur border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Play?</h2>
            <p className="text-xl text-blue-50 mb-8">
              Join thousands of athletes already using HopOn
            </p>
            <Link href="/login" className="btn btn-primary bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
