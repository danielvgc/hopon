// frontend/lib/constants.ts

export const SPORTS = [
  { id: 1, name: 'Basketball', icon: '🏀', color: '#F97316' },
  { id: 2, name: 'Soccer', icon: '⚽', color: '#10B981' },
  { id: 3, name: 'Tennis', icon: '🎾', color: '#FBBF24' },
  { id: 4, name: 'Badminton', icon: '🏸', color: '#EF4444' },
  { id: 5, name: 'Volleyball', icon: '🏐', color: '#3B82F6' },
  { id: 6, name: 'Baseball', icon: '⚾', color: '#8B5CF6' },
  { id: 7, name: 'Football', icon: '🏈', color: '#EC4899' },
  { id: 8, name: 'Hockey', icon: '🏒', color: '#06B6D4' },
  { id: 9, name: 'Table Tennis', icon: '🏓', color: '#F59E0B' },
  { id: 10, name: 'Cricket', icon: '🏏', color: '#84CC16' },
];

export const SKILL_LEVELS = [
  { value: 'Beginner', label: 'Beginner', description: 'New to the sport' },
  { value: 'Intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'Advanced', label: 'Advanced', description: 'Experienced player' },
  { value: 'Expert', label: 'Expert', description: 'Competitive level' },
];

export const EVENT_STATUS = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const COLORS = {
  primary: '#2563EB',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
};
