// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
export interface Sport {
  id: number;
  name: string;
  icon: string;
}

export interface HopOnUser {
  id: number;
  name: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  sports: Sport[];
  events_hosted: number;
  events_joined: number;
  average_rating?: number;
  rating_count: number;
  created_at?: string;
}

export interface HopOnEvent {
  id: number;
  name: string;
  description?: string;
  sport: string;
  location: string;
  latitude?: number;
  longitude?: number;
  max_players: number;
  current_players: number;
  spots_left: number;
  is_full: boolean;
  skill_level?: string;
  status: string;
  event_date?: string;
  duration_minutes?: number;
  host_user_id: number;
  host_name?: string;
  host_avatar?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  distance_km?: number;
  participants?: HopOnUser[];
}

export interface Rating {
  id: number;
  rater: HopOnUser;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  status: string;
  created_at: string;
  read_at?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface EventFilters {
  sport?: string;
  skill_level?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

// API Client Class
export class Api {
  private static getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Auth
  static getGoogleAuthUrl(): string {
    return `${API_URL}/auth/google`;
  }

  static async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return this.handleResponse(response);
  }

  static async getCurrentUser(): Promise<{ user: HopOnUser }> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Sports
  static async getSports(): Promise<{ sports: Sport[] }> {
    const response = await fetch(`${API_URL}/sports`);
    return this.handleResponse(response);
  }

  // Users
  static async getUser(userId: number): Promise<{ user: HopOnUser }> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async updateUser(userId: number, data: Partial<HopOnUser>): Promise<{ message: string; user: HopOnUser }> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getUserEvents(userId: number): Promise<{ hosted: HopOnEvent[]; participating: HopOnEvent[] }> {
    const response = await fetch(`${API_URL}/users/${userId}/events`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async getUserRatings(userId: number): Promise<{ ratings: Rating[]; average_rating?: number; rating_count: number }> {
    const response = await fetch(`${API_URL}/users/${userId}/ratings`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Events
  static async getEvents(filters?: EventFilters): Promise<{ events: HopOnEvent[]; total: number; page: number; per_page: number; total_pages: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(`${API_URL}/events?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async getEvent(eventId: number, latitude?: number, longitude?: number): Promise<{ event: HopOnEvent }> {
    const params = new URLSearchParams();
    if (latitude !== undefined) params.append('latitude', String(latitude));
    if (longitude !== undefined) params.append('longitude', String(longitude));
    
    const response = await fetch(`${API_URL}/events/${eventId}?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async createEvent(data: Partial<HopOnEvent>): Promise<{ message: string; event: HopOnEvent }> {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async updateEvent(eventId: number, data: Partial<HopOnEvent>): Promise<{ message: string; event: HopOnEvent }> {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async deleteEvent(eventId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async joinEvent(eventId: number): Promise<{ message: string; event: HopOnEvent }> {
    const response = await fetch(`${API_URL}/events/${eventId}/join`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async leaveEvent(eventId: number): Promise<{ message: string; event: HopOnEvent }> {
    const response = await fetch(`${API_URL}/events/${eventId}/leave`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Ratings
  static async createRating(data: { rated_id: number; event_id?: number; rating: number; comment?: string }): Promise<{ message: string; rating: Rating }> {
    const response = await fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Follow
  static async followUser(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/follow/${userId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async unfollowUser(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/unfollow/${userId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Messages
  static async sendMessage(receiverId: number, content: string): Promise<{ message: string; data: Message }> {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ receiver_id: receiverId, content }),
    });
    return this.handleResponse(response);
  }

  static async getConversations(): Promise<{ conversations: any[] }> {
    const response = await fetch(`${API_URL}/messages/conversations`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async getMessages(userId: number): Promise<{ messages: Message[] }> {
    const response = await fetch(`${API_URL}/messages/${userId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Notifications
  static async getNotifications(page = 1, perPage = 20): Promise<{ notifications: Notification[]; total: number; page: number; per_page: number; total_pages: number }> {
    const response = await fetch(`${API_URL}/notifications?page=${page}&per_page=${perPage}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async markNotificationRead(notificationId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  static async markAllNotificationsRead(): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}
