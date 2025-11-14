# backend/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from typing import Optional
import enum

db = SQLAlchemy()

# Enums for consistent values
class SkillLevel(enum.Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"

class EventStatus(enum.Enum):
    UPCOMING = "Upcoming"
    ONGOING = "Ongoing"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class MessageStatus(enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"

# Association table for many-to-many: User <-> Sports
user_sports = db.Table('user_sports',
    db.Column('user_id', db.Integer, db.ForeignKey('user_model.id'), primary_key=True),
    db.Column('sport_id', db.Integer, db.ForeignKey('sport.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

class Sport(db.Model):
    """Available sports in the system"""
    __tablename__ = 'sport'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)  # Basketball, Tennis, etc.
    icon = db.Column(db.String(50), nullable=True)  # Emoji or icon name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', secondary=user_sports, back_populates='sports')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'icon': self.icon
        }

class User(db.Model):
    """User model with enhanced profile"""
    __tablename__ = 'user_model'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    google_id = db.Column(db.String(100), unique=True, nullable=True, index=True)
    avatar_url = db.Column(db.Text, nullable=True)
    
    # Profile fields
    bio = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(200), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    
    # Stats
    events_hosted = db.Column(db.Integer, default=0)
    events_joined = db.Column(db.Integer, default=0)
    rating_sum = db.Column(db.Integer, default=0)
    rating_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    sports = db.relationship('Sport', secondary=user_sports, back_populates='users')
    hosted_events = db.relationship('Event', foreign_keys='Event.host_user_id', backref='host', lazy='dynamic')
    participations = db.relationship('EventParticipant', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    followers = db.relationship('Follow', foreign_keys='Follow.followed_id', backref='followed', lazy='dynamic', cascade='all, delete-orphan')
    following = db.relationship('Follow', foreign_keys='Follow.follower_id', backref='follower', lazy='dynamic', cascade='all, delete-orphan')
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy='dynamic')
    received_messages = db.relationship('Message', foreign_keys='Message.receiver_id', backref='receiver', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    given_ratings = db.relationship('Rating', foreign_keys='Rating.rater_id', backref='rater', lazy='dynamic')
    received_ratings = db.relationship('Rating', foreign_keys='Rating.rated_id', backref='rated', lazy='dynamic')
    
    @property
    def average_rating(self):
        """Calculate average rating"""
        if self.rating_count == 0:
            return None
        return round(self.rating_sum / self.rating_count, 2)
    
    def to_dict(self, include_private=False):
        """Serialize user to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'location': self.location,
            'sports': [sport.to_dict() for sport in self.sports],
            'events_hosted': self.events_hosted,
            'events_joined': self.events_joined,
            'average_rating': self.average_rating,
            'rating_count': self.rating_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        
        if include_private:
            data.update({
                'email': self.email,
                'phone': self.phone,
                'latitude': self.latitude,
                'longitude': self.longitude,
            })
        
        return data

class Event(db.Model):
    """Enhanced event model"""
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    sport = db.Column(db.String(50), nullable=False, index=True)
    
    # Location
    location = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float, nullable=True, index=True)
    longitude = db.Column(db.Float, nullable=True, index=True)
    
    # Details
    max_players = db.Column(db.Integer, nullable=False)
    current_players = db.Column(db.Integer, default=1)  # Host counts as 1
    skill_level = db.Column(db.String(32), nullable=True, index=True)
    
    # Status and timing
    status = db.Column(db.String(20), default=EventStatus.UPCOMING.value, index=True)
    event_date = db.Column(db.DateTime, nullable=True, index=True)
    duration_minutes = db.Column(db.Integer, nullable=True)  # Expected duration
    
    # Host
    host_user_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False)
    
    # Metadata
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    participants = db.relationship('EventParticipant', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    
    __table_args__ = (
        db.Index('idx_event_location', 'latitude', 'longitude'),
        db.Index('idx_event_date_status', 'event_date', 'status'),
    )
    
    @property
    def is_full(self):
        """Check if event is at capacity"""
        return self.current_players >= self.max_players
    
    @property
    def spots_left(self):
        """Calculate remaining spots"""
        return max(0, self.max_players - self.current_players)
    
    def to_dict(self, include_participants=False):
        """Serialize event to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'sport': self.sport,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'max_players': self.max_players,
            'current_players': self.current_players,
            'spots_left': self.spots_left,
            'is_full': self.is_full,
            'skill_level': self.skill_level,
            'status': self.status,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'duration_minutes': self.duration_minutes,
            'host_user_id': self.host_user_id,
            'host_name': self.host.name if self.host else None,
            'host_avatar': self.host.avatar_url if self.host else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_participants:
            data['participants'] = [p.user.to_dict() for p in self.participants.all()]
        
        return data

class EventParticipant(db.Model):
    """Link between users and events they're participating in"""
    __tablename__ = 'event_participants'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='confirmed')  # confirmed, cancelled
    
    __table_args__ = (
        db.UniqueConstraint('event_id', 'user_id', name='unique_event_participant'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'user_id': self.user_id,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'status': self.status
        }

class Follow(db.Model):
    """User following system"""
    __tablename__ = 'follows'
    
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False)
    followed_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('follower_id', 'followed_id', name='unique_follow'),
        db.CheckConstraint('follower_id != followed_id', name='no_self_follow'),
    )

class Rating(db.Model):
    """User ratings system"""
    __tablename__ = 'ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    rater_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False)
    rated_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='valid_rating'),
        db.CheckConstraint('rater_id != rated_id', name='no_self_rating'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'rater': self.rater.to_dict() if self.rater else None,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Message(db.Model):
    """Direct messaging between users"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default=MessageStatus.SENT.value)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    read_at = db.Column(db.DateTime, nullable=True)
    
    __table_args__ = (
        db.Index('idx_conversation', 'sender_id', 'receiver_id', 'created_at'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'content': self.content,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
        }

class Notification(db.Model):
    """User notifications"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user_model.id'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)  # event_invite, message, follow, rating
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500), nullable=True)  # URL to navigate to
    read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'link': self.link,
            'read': self.read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
