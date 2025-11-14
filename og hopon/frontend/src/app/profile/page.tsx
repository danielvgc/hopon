// frontend/src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Api, HopOnEvent, Sport } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  
  const [hostedEvents, setHostedEvents] = useState<HopOnEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<HopOnEvent[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    phone: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [eventsData, sportsData] = await Promise.all([
          Api.getUserEvents(user.id),
          Api.getSports(),
        ]);

        setHostedEvents(eventsData.hosted);
        setJoinedEvents(eventsData.participating);
        setSports(sportsData.sports);
        
        setFormData({
          name: user.name || '',
          bio: user.bio || '',
          location: user.location || '',
          phone: user.phone || '',
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      await Api.updateUser(user.id, formData);
      await refreshUser();
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      router.push('/');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12 border-4 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <div className="flex gap-3">
            <Link href="/discover" className="btn btn-outline">
              Back to Discover
            </Link>
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-4xl mx-auto mb-4">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                {user.location && (
                  <p className="text-gray-600 flex items-center justify-center gap-1 mt-1">
                    📍 {user.location}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{user.events_hosted}</div>
                  <div className="text-xs text-gray-600">Hosted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{user.events_joined}</div>
                  <div className="text-xs text-gray-600">Joined</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {user.average_rating?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, State"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Optional"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        placeholder="Tell others about yourself..."
                        className="input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="btn btn-primary flex-1">
                        Save
                      </button>
                      <button onClick={() => setEditing(false)} className="btn btn-outline">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {user.bio && (
                      <div className="mb-4">
                        <h3 className="font-bold text-gray-900 mb-2">About</h3>
                        <p className="text-gray-600">{user.bio}</p>
                      </div>
                    )}
                    <button onClick={() => setEditing(true)} className="btn btn-primary w-full">
                      Edit Profile
                    </button>
                  </>
                )}
              </div>

              {/* Favorite Sports */}
              {user.sports && user.sports.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-gray-900 mb-3">Sports</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.sports.map((sport) => (
                      <span key={sport.id} className="badge badge-primary">
                        {sport.icon} {sport.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hosted Events */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Hosted Events</h2>
              {hostedEvents.length === 0 ? (
                <div className="card p-8 text-center">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-gray-600 mb-4">You haven't hosted any events yet</p>
                  <Link href="/create" className="btn btn-primary">
                    Create Your First Event
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {hostedEvents.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className="card p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-gray-900 mb-1">{event.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{event.sport}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">📍 {event.location}</span>
                          <span className="badge badge-primary">
                            {event.current_players}/{event.max_players}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Joined Events */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Joined Events</h2>
              {joinedEvents.length === 0 ? (
                <div className="card p-8 text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-gray-600 mb-4">You haven't joined any events yet</p>
                  <Link href="/discover" className="btn btn-primary">
                    Discover Events
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {joinedEvents.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className="card p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-gray-900 mb-1">{event.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{event.sport}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">📍 {event.location}</span>
                          <span className="badge badge-success">Joined</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
