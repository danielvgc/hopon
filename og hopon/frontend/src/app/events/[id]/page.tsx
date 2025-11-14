// frontend/src/app/events/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Api, HopOnEvent } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { socketClient } from '@/lib/socket';

export default function EventDetailPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);
  
  const [event, setEvent] = useState<HopOnEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const isHost = user && event && event.host_user_id === user.id;
  const hasJoined = event?.participants?.some(p => p.id === user?.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { event: eventData } = await Api.getEvent(eventId);
        setEvent(eventData);
      } catch (error) {
        console.error('Failed to fetch event:', error);
        alert('Event not found');
        router.push('/discover');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchEvent();
      // Join event room for real-time updates
      socketClient.joinEventRoom(eventId);
    }

    return () => {
      socketClient.leaveEventRoom(eventId);
    };
  }, [isAuthenticated, eventId, router]);

  // Listen for real-time event updates
  useEffect(() => {
    const handleEventUpdate = (updatedEvent: HopOnEvent) => {
      if (updatedEvent.id === eventId) {
        setEvent(updatedEvent);
      }
    };

    socketClient.onEventUpdated(handleEventUpdate);

    return () => {
      socketClient.offEventUpdated();
    };
  }, [eventId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const { event: updatedEvent } = await Api.joinEvent(eventId);
      setEvent(updatedEvent);
      alert('Successfully joined the event!');
    } catch (error: any) {
      alert(error.message || 'Failed to join event');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this event?')) return;

    setJoining(true);
    try {
      const { event: updatedEvent } = await Api.leaveEvent(eventId);
      setEvent(updatedEvent);
      alert('Successfully left the event');
    } catch (error: any) {
      alert(error.message || 'Failed to leave event');
    } finally {
      setJoining(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to cancel this event? This cannot be undone.')) return;

    try {
      await Api.deleteEvent(eventId);
      alert('Event cancelled successfully');
      router.push('/discover');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel event');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12 border-4 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <button onClick={() => router.push('/discover')} className="btn btn-primary">
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container py-4">
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-700 mb-2">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-gray-600">{event.sport}</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info Card */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>

                {event.event_date && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="font-medium text-gray-900">Date & Time</p>
                      <p className="text-gray-600">
                        {new Date(event.event_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {event.duration_minutes && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <p className="font-medium text-gray-900">Duration</p>
                      <p className="text-gray-600">{event.duration_minutes} minutes</p>
                    </div>
                  </div>
                )}

                {event.skill_level && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="font-medium text-gray-900">Skill Level</p>
                      <p className="text-gray-600">{event.skill_level}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="font-medium text-gray-900">Players</p>
                    <p className="text-gray-600">
                      {event.current_players} / {event.max_players}
                      {event.is_full && <span className="text-red-600 ml-2">(Full)</span>}
                    </p>
                  </div>
                </div>
              </div>

              {event.description && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {event.notes && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-bold text-gray-900 mb-2">Additional Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{event.notes}</p>
                </div>
              )}
            </div>

            {/* Participants */}
            {event.participants && event.participants.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Participants ({event.participants.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {event.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{participant.name}</p>
                        {participant.id === event.host_user_id && (
                          <span className="badge badge-primary text-xs">Host</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="card p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Availability</span>
                  <span className="text-sm font-bold text-gray-900">
                    {event.spots_left} spots left
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(event.current_players / event.max_players) * 100}%` }}
                  ></div>
                </div>
              </div>

              {isHost ? (
                <div className="space-y-3">
                  <button className="btn btn-outline w-full" onClick={() => router.push(`/events/${event.id}/edit`)}>
                    Edit Event
                  </button>
                  <button className="btn btn-danger w-full" onClick={handleDelete}>
                    Cancel Event
                  </button>
                </div>
              ) : hasJoined ? (
                <button
                  className="btn btn-outline w-full"
                  onClick={handleLeave}
                  disabled={joining}
                >
                  {joining ? 'Leaving...' : 'Leave Event'}
                </button>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={handleJoin}
                  disabled={joining || event.is_full}
                >
                  {joining ? 'Joining...' : event.is_full ? 'Event Full' : 'Join Event'}
                </button>
              )}
            </div>

            {/* Host Info */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Hosted By</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                  {event.host_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{event.host_name}</p>
                  <p className="text-sm text-gray-600">Event Organizer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
