// frontend/src/app/discover/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Api, HopOnEvent, Sport } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DiscoverPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  
  const [events, setEvents] = useState<HopOnEvent[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, sportsData] = await Promise.all([
          Api.getEvents({
            latitude: userLocation?.lat,
            longitude: userLocation?.lng,
            sport: selectedSport || undefined,
            status: 'Upcoming',
          }),
          Api.getSports(),
        ]);

        setEvents(eventsData.events);
        setSports(sportsData.sports);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, selectedSport, userLocation]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12 border-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discover Games</h1>
            <p className="text-gray-600">Find pickup games near you</p>
          </div>
          <div className="flex gap-3">
            <Link href="/create" className="btn btn-primary">
              + Create Game
            </Link>
            <Link href="/profile" className="btn btn-outline">
              Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <button
            onClick={() => setSelectedSport('')}
            className={`btn ${!selectedSport ? 'btn-primary' : 'btn-outline'}`}
          >
            All Sports
          </button>
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.name)}
              className={`btn ${selectedSport === sport.name ? 'btn-primary' : 'btn-outline'}`}
            >
              {sport.icon} {sport.name}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No games found</h2>
            <p className="text-gray-600 mb-6">Be the first to create a game!</p>
            <Link href="/create" className="btn btn-primary">
              Create Game
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="card p-6 hover:shadow-lg transition-all cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {event.name}
                      </h3>
                      <p className="text-sm text-gray-600">{event.sport}</p>
                    </div>
                    <span className="badge badge-primary">
                      {event.current_players}/{event.max_players}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="truncate">{event.location}</span>
                    </div>
                    {event.event_date && (
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {event.skill_level && (
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span>{event.skill_level}</span>
                      </div>
                    )}
                    {event.distance_km !== undefined && (
                      <div className="flex items-center gap-2">
                        <span>🚶</span>
                        <span>{event.distance_km.toFixed(1)} km away</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {event.host_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">
                      Hosted by {event.host_name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
