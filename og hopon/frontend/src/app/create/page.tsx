// frontend/src/app/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Api, Sport } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { SKILL_LEVELS } from '@/lib/constants';

export default function CreateEventPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    max_players: 10,
    skill_level: '',
    event_date: '',
    duration_minutes: 60,
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const { sports } = await Api.getSports();
        setSports(sports);
      } catch (error) {
        console.error('Failed to fetch sports:', error);
      }
    };
    fetchSports();
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { event } = await Api.createEvent({
        ...formData,
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : undefined,
      });

      alert('Event created successfully!');
      router.push(`/events/${event.id}`);
    } catch (error: any) {
      alert(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_players' || name === 'duration_minutes' ? parseInt(value) : value,
    }));
  };

  if (authLoading) {
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
        <div className="container py-4">
          <h1 className="text-2xl font-bold text-gray-900">Create New Game</h1>
          <p className="text-gray-600">Organize a pickup game and invite players</p>
        </div>
      </div>

      <div className="container py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="card p-8">
          {/* Event Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Saturday Morning Basketball"
              className="input"
            />
          </div>

          {/* Sport */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport *
            </label>
            <select
              name="sport"
              value={formData.sport}
              onChange={handleChange}
              required
              className="input"
            >
              <option value="">Select a sport</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.name}>
                  {sport.icon} {sport.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="e.g., Central Park Basketball Court"
              className="input"
            />
            <p className="text-sm text-gray-500 mt-1">
              Be specific - include landmarks or court numbers
            </p>
          </div>

          {/* Date & Time */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date & Time
              </label>
              <input
                type="datetime-local"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="15"
                max="480"
                className="input"
              />
            </div>
          </div>

          {/* Max Players & Skill Level */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Players *
              </label>
              <input
                type="number"
                name="max_players"
                value={formData.max_players}
                onChange={handleChange}
                required
                min="2"
                max="100"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Level
              </label>
              <select
                name="skill_level"
                value={formData.skill_level}
                onChange={handleChange}
                className="input"
              >
                <option value="">Any skill level</option>
                {SKILL_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Tell players more about the game..."
              className="input"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any special instructions or requirements?"
              className="input"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner"></span>
                  Creating...
                </span>
              ) : (
                'Create Event'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
