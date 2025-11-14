# backend/app.py
#!/usr/bin/env python3
"""
HopOn Backend API
Complete Flask application with all MP3 features
"""
import os
import json
import hashlib
from uuid import uuid4
from datetime import datetime, timedelta
from typing import Optional
from functools import wraps
from math import radians, cos, sin, asin, sqrt

import jwt
from authlib.integrations.flask_client import OAuth
from flask import Flask, jsonify, request, g, redirect, url_for, make_response, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from sqlalchemy import or_, and_, func
from sqlalchemy.exc import IntegrityError
from marshmallow import ValidationError

from config import config, Config
from models import (
    db, User, Event, EventParticipant, Follow, Rating, 
    Message, Notification, Sport, EventStatus, MessageStatus
)
from validators import (
    event_create_schema, event_update_schema, user_update_schema,
    rating_create_schema, message_create_schema, event_search_schema
)

def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    Config.validate()  # Validate required env vars
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=[app.config['FRONTEND_URL']], supports_credentials=True)
    
    # Initialize SocketIO
    socketio = SocketIO(
        app,
        cors_allowed_origins=app.config['FRONTEND_URL'],
        async_mode='gevent',
        logger=True,
        engineio_logger=True
    )
    
    # OAuth setup
    oauth = OAuth(app)
    google = oauth.register(
        name='google',
        client_id=app.config['GOOGLE_CLIENT_ID'],
        client_secret=app.config['GOOGLE_CLIENT_SECRET'],
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )
    
    # ==================== UTILITIES ====================
    
    def haversine_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two points in km using Haversine formula"""
        if None in (lat1, lon1, lat2, lon2):
            return None
        
        R = 6371  # Earth's radius in km
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        return R * c
    
    def generate_jwt_token(user_id: int, token_type: str = 'access') -> str:
        """Generate JWT token"""
        expires_in = (
            app.config['JWT_ACCESS_TOKEN_EXPIRES'] 
            if token_type == 'access' 
            else app.config['JWT_REFRESH_TOKEN_EXPIRES']
        )
        payload = {
            'user_id': user_id,
            'type': token_type,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, app.config['JWT_SECRET'], algorithm='HS256')
    
    def decode_jwt_token(token: str) -> Optional[dict]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, app.config['JWT_SECRET'], algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def require_auth(f):
        """Decorator to require authentication"""
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Missing or invalid authorization header'}), 401
            
            token = auth_header.split(' ')[1]
            payload = decode_jwt_token(token)
            
            if not payload or payload.get('type') != 'access':
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            user = db.session.get(User, payload['user_id'])
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            g.current_user = user
            return f(*args, **kwargs)
        
        return decorated
    
    def create_notification(user_id: int, type: str, title: str, message: str, link: str = None):
        """Helper to create a notification"""
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            link=link
        )
        db.session.add(notification)
        db.session.commit()
        
        # Emit real-time notification via SocketIO
        socketio.emit('notification', notification.to_dict(), room=f'user_{user_id}')
        
        return notification
    
    # ==================== AUTH ROUTES ====================
    
    @app.route('/auth/google', methods=['GET'])
    def google_login():
        """Initiate Google OAuth login"""
        redirect_uri = url_for('google_callback', _external=True)
        return google.authorize_redirect(redirect_uri)
    
    @app.route('/auth/google/callback', methods=['GET'])
    def google_callback():
        """Handle Google OAuth callback"""
        try:
            token = google.authorize_access_token()
            user_info = token.get('userinfo')
            
            if not user_info:
                return redirect(f"{app.config['FRONTEND_URL']}/login?error=auth_failed")
            
            # Find or create user
            user = User.query.filter_by(google_id=user_info['sub']).first()
            
            if not user:
                user = User(
                    email=user_info['email'],
                    name=user_info.get('name', user_info['email']),
                    google_id=user_info['sub'],
                    avatar_url=user_info.get('picture')
                )
                db.session.add(user)
                db.session.commit()
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Generate tokens
            access_token = generate_jwt_token(user.id, 'access')
            refresh_token = generate_jwt_token(user.id, 'refresh')
            
            # Redirect to frontend with tokens
            redirect_url = (
                f"{app.config['FRONTEND_URL']}/auth/callback"
                f"?access_token={access_token}&refresh_token={refresh_token}"
            )
            return redirect(redirect_url)
            
        except Exception as e:
            app.logger.error(f"OAuth error: {str(e)}")
            return redirect(f"{app.config['FRONTEND_URL']}/login?error=auth_failed")
    
    @app.route('/auth/refresh', methods=['POST'])
    def refresh_token():
        """Refresh access token using refresh token"""
        data = request.get_json()
        refresh = data.get('refresh_token')
        
        if not refresh:
            return jsonify({'error': 'Refresh token required'}), 400
        
        payload = decode_jwt_token(refresh)
        if not payload or payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        user = db.session.get(User, payload['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        new_access = generate_jwt_token(user.id, 'access')
        return jsonify({'access_token': new_access}), 200
    
    @app.route('/auth/me', methods=['GET'])
    @require_auth
    def get_current_user():
        """Get current authenticated user"""
        return jsonify({'user': g.current_user.to_dict(include_private=True)}), 200
    
    # ==================== USER ROUTES ====================
    
    @app.route('/users/<int:user_id>', methods=['GET'])
    @require_auth
    def get_user(user_id):
        """Get user profile by ID"""
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        is_self = (user.id == g.current_user.id)
        return jsonify({'user': user.to_dict(include_private=is_self)}), 200
    
    @app.route('/users/<int:user_id>', methods=['PUT'])
    @require_auth
    def update_user(user_id):
        """Update user profile"""
        if user_id != g.current_user.id:
            return jsonify({'error': 'Cannot update another user\'s profile'}), 403
        
        try:
            data = user_update_schema.load(request.get_json())
        except ValidationError as e:
            return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
        
        user = g.current_user
        
        # Update basic fields
        for field in ['name', 'bio', 'location', 'latitude', 'longitude', 'phone']:
            if field in data:
                setattr(user, field, data[field])
        
        # Update sports (many-to-many)
        if 'sports' in data:
            user.sports.clear()
            for sport_id in data['sports']:
                sport = db.session.get(Sport, sport_id)
                if sport:
                    user.sports.append(sport)
        
        db.session.commit()
        return jsonify({'message': 'Profile updated', 'user': user.to_dict(include_private=True)}), 200
    
    @app.route('/users/<int:user_id>/events', methods=['GET'])
    @require_auth
    def get_user_events(user_id):
        """Get events for a user (hosted + participating)"""
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Hosted events
        hosted = Event.query.filter_by(host_user_id=user_id).all()
        
        # Participating events
        participations = EventParticipant.query.filter_by(user_id=user_id).all()
        participating = [p.event for p in participations if p.event.host_user_id != user_id]
        
        return jsonify({
            'hosted': [e.to_dict() for e in hosted],
            'participating': [e.to_dict() for e in participating]
        }), 200
    
    # ==================== CONTINUE TO PART 2 ====================
    # ==================== PART 2: EVENT ROUTES ====================
    
    @app.route('/events', methods=['GET'])
    @require_auth
    def get_events():
        """Get all events with optional filtering"""
        try:
            filters = event_search_schema.load(request.args.to_dict())
        except ValidationError as e:
            return jsonify({'error': 'Invalid filters', 'details': e.messages}), 400
        
        # Start query
        query = Event.query
        
        # Apply filters
        if filters.get('sport'):
            query = query.filter(Event.sport == filters['sport'])
        
        if filters.get('skill_level'):
            query = query.filter(Event.skill_level == filters['skill_level'])
        
        if filters.get('status'):
            query = query.filter(Event.status == filters['status'])
        else:
            # By default, show only upcoming events
            query = query.filter(Event.status == EventStatus.UPCOMING.value)
        
        # Date range filter
        if filters.get('date_from'):
            query = query.filter(Event.event_date >= filters['date_from'])
        
        if filters.get('date_to'):
            query = query.filter(Event.event_date <= filters['date_to'])
        
        # Get all events (before distance filter)
        events = query.all()
        
        # Distance-based filter (client can provide their location)
        if filters.get('latitude') and filters.get('longitude'):
            user_lat = filters['latitude']
            user_lon = filters['longitude']
            radius = filters.get('radius_km', app.config['DEFAULT_RADIUS_KM'])
            
            # Filter by distance
            filtered_events = []
            for event in events:
                if event.latitude and event.longitude:
                    distance = haversine_distance(user_lat, user_lon, event.latitude, event.longitude)
                    if distance and distance <= radius:
                        event_dict = event.to_dict()
                        event_dict['distance_km'] = round(distance, 2)
                        filtered_events.append(event_dict)
            
            # Sort by distance
            filtered_events.sort(key=lambda x: x['distance_km'])
            events_data = filtered_events
        else:
            events_data = [e.to_dict() for e in events]
        
        # Pagination
        page = filters.get('page', 1)
        per_page = min(filters.get('per_page', app.config['DEFAULT_PAGE_SIZE']), app.config['MAX_PAGE_SIZE'])
        
        start = (page - 1) * per_page
        end = start + per_page
        paginated = events_data[start:end]
        
        return jsonify({
            'events': paginated,
            'total': len(events_data),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(events_data) + per_page - 1) // per_page
        }), 200
    
    @app.route('/events/<int:event_id>', methods=['GET'])
    @require_auth
    def get_event(event_id):
        """Get single event by ID"""
        event = db.session.get(Event, event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Calculate distance if user provides location
        user_lat = request.args.get('latitude', type=float)
        user_lon = request.args.get('longitude', type=float)
        
        event_dict = event.to_dict(include_participants=True)
        
        if user_lat and user_lon and event.latitude and event.longitude:
            distance = haversine_distance(user_lat, user_lon, event.latitude, event.longitude)
            if distance:
                event_dict['distance_km'] = round(distance, 2)
        
        return jsonify({'event': event_dict}), 200
    
    @app.route('/events', methods=['POST'])
    @require_auth
    def create_event():
        """Create a new event"""
        try:
            data = event_create_schema.load(request.get_json())
        except ValidationError as e:
            return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
        
        # Create event
        event = Event(
            name=data['name'],
            description=data.get('description'),
            sport=data['sport'],
            location=data['location'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            max_players=data['max_players'],
            skill_level=data.get('skill_level'),
            event_date=data.get('event_date'),
            duration_minutes=data.get('duration_minutes'),
            notes=data.get('notes'),
            host_user_id=g.current_user.id,
            status=EventStatus.UPCOMING.value
        )
        
        db.session.add(event)
        g.current_user.events_hosted += 1
        db.session.commit()
        
        # Notify followers
        followers = Follow.query.filter_by(followed_id=g.current_user.id).all()
        for follow in followers:
            create_notification(
                user_id=follow.follower_id,
                type='event_created',
                title=f'New event from {g.current_user.name}',
                message=f'{g.current_user.name} created a new {data["sport"]} event',
                link=f'/events/{event.id}'
            )
        
        return jsonify({
            'message': 'Event created successfully',
            'event': event.to_dict()
        }), 201
    
    @app.route('/events/<int:event_id>', methods=['PUT'])
    @require_auth
    def update_event(event_id):
        """Update an event"""
        event = db.session.get(Event, event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Only host can update
        if event.host_user_id != g.current_user.id:
            return jsonify({'error': 'Only the host can update this event'}), 403
        
        try:
            data = event_update_schema.load(request.get_json())
        except ValidationError as e:
            return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
        
        # Update fields
        for field in ['name', 'description', 'location', 'latitude', 'longitude', 
                      'max_players', 'skill_level', 'event_date', 'duration_minutes', 
                      'notes', 'status']:
            if field in data:
                setattr(event, field, data[field])
        
        event.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Notify participants of changes
        participants = EventParticipant.query.filter_by(event_id=event_id).all()
        for participant in participants:
            if participant.user_id != g.current_user.id:
                create_notification(
                    user_id=participant.user_id,
                    type='event_updated',
                    title='Event Updated',
                    message=f'{event.name} has been updated',
                    link=f'/events/{event.id}'
                )
        
        return jsonify({
            'message': 'Event updated successfully',
            'event': event.to_dict()
        }), 200
    
    @app.route('/events/<int:event_id>', methods=['DELETE'])
    @require_auth
    def delete_event(event_id):
        """Cancel/delete an event"""
        event = db.session.get(Event, event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Only host can delete
        if event.host_user_id != g.current_user.id:
            return jsonify({'error': 'Only the host can delete this event'}), 403
        
        # Notify all participants
        participants = EventParticipant.query.filter_by(event_id=event_id).all()
        for participant in participants:
            create_notification(
                user_id=participant.user_id,
                type='event_cancelled',
                title='Event Cancelled',
                message=f'{event.name} has been cancelled',
                link=None
            )
        
        # Mark as cancelled instead of deleting
        event.status = EventStatus.CANCELLED.value
        db.session.commit()
        
        return jsonify({'message': 'Event cancelled successfully'}), 200
    
    @app.route('/events/<int:event_id>/join', methods=['POST'])
    @require_auth
    def join_event(event_id):
        """Join an event"""
        event = db.session.get(Event, event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Check if event is full
        if event.is_full:
            return jsonify({'error': 'Event is full'}), 400
        
        # Check if already joined
        existing = EventParticipant.query.filter_by(
            event_id=event_id,
            user_id=g.current_user.id
        ).first()
        
        if existing:
            return jsonify({'error': 'Already joined this event'}), 400
        
        # Create participation
        participation = EventParticipant(
            event_id=event_id,
            user_id=g.current_user.id,
            status='confirmed'
        )
        
        db.session.add(participation)
        event.current_players += 1
        g.current_user.events_joined += 1
        db.session.commit()
        
        # Notify host
        create_notification(
            user_id=event.host_user_id,
            type='event_join',
            title='New Participant',
            message=f'{g.current_user.name} joined {event.name}',
            link=f'/events/{event.id}'
        )
        
        # Emit real-time update
        socketio.emit('event_updated', event.to_dict(), room=f'event_{event_id}')
        
        return jsonify({
            'message': 'Successfully joined event',
            'event': event.to_dict()
        }), 200
    
    @app.route('/events/<int:event_id>/leave', methods=['POST'])
    @require_auth
    def leave_event(event_id):
        """Leave an event"""
        event = db.session.get(Event, event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Can't leave if you're the host
        if event.host_user_id == g.current_user.id:
            return jsonify({'error': 'Host cannot leave their own event. Cancel it instead.'}), 400
        
        # Find participation
        participation = EventParticipant.query.filter_by(
            event_id=event_id,
            user_id=g.current_user.id
        ).first()
        
        if not participation:
            return jsonify({'error': 'Not participating in this event'}), 400
        
        # Remove participation
        db.session.delete(participation)
        event.current_players = max(1, event.current_players - 1)
        g.current_user.events_joined = max(0, g.current_user.events_joined - 1)
        db.session.commit()
        
        # Notify host
        create_notification(
            user_id=event.host_user_id,
            type='event_leave',
            title='Participant Left',
            message=f'{g.current_user.name} left {event.name}',
            link=f'/events/{event.id}'
        )
        
        # Emit real-time update
        socketio.emit('event_updated', event.to_dict(), room=f'event_{event_id}')
        
        return jsonify({
            'message': 'Successfully left event',
            'event': event.to_dict()
        }), 200
    
    # ==================== CONTINUE TO PART 3 ====================
    # ==================== PART 3: RATINGS, MESSAGES, NOTIFICATIONS ====================
    
    @app.route('/sports', methods=['GET'])
    def get_sports():
        """Get all available sports"""
        sports = Sport.query.all()
        return jsonify({'sports': [s.to_dict() for s in sports]}), 200
    
    @app.route('/ratings', methods=['POST'])
    @require_auth
    def create_rating():
        """Create a rating for another user"""
        try:
            data = rating_create_schema.load(request.get_json())
        except ValidationError as e:
            return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
        
        # Can't rate yourself
        if data['rated_id'] == g.current_user.id:
            return jsonify({'error': 'Cannot rate yourself'}), 400
        
        # Check if rated user exists
        rated_user = db.session.get(User, data['rated_id'])
        if not rated_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if already rated this user for this event
        if data.get('event_id'):
            existing = Rating.query.filter_by(
                rater_id=g.current_user.id,
                rated_id=data['rated_id'],
                event_id=data['event_id']
            ).first()
            if existing:
                return jsonify({'error': 'Already rated this user for this event'}), 400
        
        # Create rating
        rating = Rating(
            rater_id=g.current_user.id,
            rated_id=data['rated_id'],
            event_id=data.get('event_id'),
            rating=data['rating'],
            comment=data.get('comment')
        )
        
        db.session.add(rating)
        
        # Update user's rating stats
        rated_user.rating_sum += data['rating']
        rated_user.rating_count += 1
        
        db.session.commit()
        
        # Notify rated user
        create_notification(
            user_id=rated_user.id,
            type='rating_received',
            title='New Rating',
            message=f'{g.current_user.name} rated you {data["rating"]} stars',
            link=f'/profile/{g.current_user.id}'
        )
        
        return jsonify({
            'message': 'Rating created successfully',
            'rating': rating.to_dict()
        }), 201
    
    @app.route('/users/<int:user_id>/ratings', methods=['GET'])
    @require_auth
    def get_user_ratings(user_id):
        """Get ratings for a user"""
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        ratings = Rating.query.filter_by(rated_id=user_id).order_by(Rating.created_at.desc()).limit(50).all()
        
        return jsonify({
            'ratings': [r.to_dict() for r in ratings],
            'average_rating': user.average_rating,
            'rating_count': user.rating_count
        }), 200
    
    @app.route('/messages', methods=['POST'])
    @require_auth
    def send_message():
        """Send a message to another user"""
        try:
            data = message_create_schema.load(request.get_json())
        except ValidationError as e:
            return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
        
        # Can't message yourself
        if data['receiver_id'] == g.current_user.id:
            return jsonify({'error': 'Cannot message yourself'}), 400
        
        # Check if receiver exists
        receiver = db.session.get(User, data['receiver_id'])
        if not receiver:
            return jsonify({'error': 'Receiver not found'}), 404
        
        # Create message
        message = Message(
            sender_id=g.current_user.id,
            receiver_id=data['receiver_id'],
            content=data['content'],
            status=MessageStatus.SENT.value
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Emit real-time message via SocketIO
        socketio.emit('new_message', message.to_dict(), room=f'user_{data["receiver_id"]}')
        
        # Create notification
        create_notification(
            user_id=data['receiver_id'],
            type='message',
            title='New Message',
            message=f'{g.current_user.name} sent you a message',
            link=f'/messages/{g.current_user.id}'
        )
        
        return jsonify({
            'message': 'Message sent successfully',
            'data': message.to_dict()
        }), 201
    
    @app.route('/messages/conversations', methods=['GET'])
    @require_auth
    def get_conversations():
        """Get all conversations for current user"""
        # Get all users the current user has messaged with
        sent = db.session.query(Message.receiver_id).filter_by(sender_id=g.current_user.id).distinct()
        received = db.session.query(Message.sender_id).filter_by(receiver_id=g.current_user.id).distinct()
        
        user_ids = set([r[0] for r in sent] + [r[0] for r in received])
        
        conversations = []
        for user_id in user_ids:
            user = db.session.get(User, user_id)
            if not user:
                continue
            
            # Get last message
            last_msg = Message.query.filter(
                or_(
                    and_(Message.sender_id == g.current_user.id, Message.receiver_id == user_id),
                    and_(Message.sender_id == user_id, Message.receiver_id == g.current_user.id)
                )
            ).order_by(Message.created_at.desc()).first()
            
            # Count unread messages
            unread_count = Message.query.filter_by(
                sender_id=user_id,
                receiver_id=g.current_user.id,
                status=MessageStatus.SENT.value
            ).count()
            
            conversations.append({
                'user': user.to_dict(),
                'last_message': last_msg.to_dict() if last_msg else None,
                'unread_count': unread_count
            })
        
        # Sort by last message time
        conversations.sort(key=lambda x: x['last_message']['created_at'] if x['last_message'] else '', reverse=True)
        
        return jsonify({'conversations': conversations}), 200
    
    @app.route('/messages/<int:other_user_id>', methods=['GET'])
    @require_auth
    def get_messages_with_user(other_user_id):
        """Get all messages with a specific user"""
        other_user = db.session.get(User, other_user_id)
        if not other_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get messages between current user and other user
        messages = Message.query.filter(
            or_(
                and_(Message.sender_id == g.current_user.id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == g.current_user.id)
            )
        ).order_by(Message.created_at.asc()).all()
        
        # Mark messages as read
        unread = Message.query.filter_by(
            sender_id=other_user_id,
            receiver_id=g.current_user.id,
            status=MessageStatus.SENT.value
        ).all()
        
        for msg in unread:
            msg.status = MessageStatus.READ.value
            msg.read_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'messages': [m.to_dict() for m in messages]}), 200
    
    @app.route('/notifications', methods=['GET'])
    @require_auth
    def get_notifications():
        """Get notifications for current user"""
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        notifications = Notification.query.filter_by(
            user_id=g.current_user.id
        ).order_by(Notification.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'notifications': [n.to_dict() for n in notifications.items],
            'total': notifications.total,
            'page': page,
            'per_page': per_page,
            'total_pages': notifications.pages
        }), 200
    
    @app.route('/notifications/<int:notification_id>/read', methods=['PUT'])
    @require_auth
    def mark_notification_read(notification_id):
        """Mark notification as read"""
        notification = db.session.get(Notification, notification_id)
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        if notification.user_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        notification.read = True
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
    
    @app.route('/notifications/read-all', methods=['PUT'])
    @require_auth
    def mark_all_notifications_read():
        """Mark all notifications as read"""
        Notification.query.filter_by(
            user_id=g.current_user.id,
            read=False
        ).update({'read': True})
        
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
    
    @app.route('/follow/<int:user_id>', methods=['POST'])
    @require_auth
    def follow_user(user_id):
        """Follow a user"""
        if user_id == g.current_user.id:
            return jsonify({'error': 'Cannot follow yourself'}), 400
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if already following
        existing = Follow.query.filter_by(
            follower_id=g.current_user.id,
            followed_id=user_id
        ).first()
        
        if existing:
            return jsonify({'error': 'Already following this user'}), 400
        
        follow = Follow(follower_id=g.current_user.id, followed_id=user_id)
        db.session.add(follow)
        db.session.commit()
        
        # Notify followed user
        create_notification(
            user_id=user_id,
            type='follow',
            title='New Follower',
            message=f'{g.current_user.name} started following you',
            link=f'/profile/{g.current_user.id}'
        )
        
        return jsonify({'message': 'Successfully followed user'}), 200
    
    @app.route('/unfollow/<int:user_id>', methods=['POST'])
    @require_auth
    def unfollow_user(user_id):
        """Unfollow a user"""
        follow = Follow.query.filter_by(
            follower_id=g.current_user.id,
            followed_id=user_id
        ).first()
        
        if not follow:
            return jsonify({'error': 'Not following this user'}), 400
        
        db.session.delete(follow)
        db.session.commit()
        
        return jsonify({'message': 'Successfully unfollowed user'}), 200
    
    # ==================== SOCKETIO HANDLERS ====================
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        auth_token = request.args.get('token')
        if not auth_token:
            return False
        
        payload = decode_jwt_token(auth_token)
        if not payload:
            return False
        
        user = db.session.get(User, payload['user_id'])
        if not user:
            return False
        
        # Join user's personal room
        join_room(f'user_{user.id}')
        emit('connected', {'message': 'Connected to HopOn'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        pass
    
    @socketio.on('join_event')
    def handle_join_event(data):
        """Join an event's room for real-time updates"""
        event_id = data.get('event_id')
        if event_id:
            join_room(f'event_{event_id}')
    
    @socketio.on('leave_event')
    def handle_leave_event(data):
        """Leave an event's room"""
        event_id = data.get('event_id')
        if event_id:
            leave_room(f'event_{event_id}')
    
    # ==================== DATABASE INITIALIZATION ====================
    
    @app.cli.command('init-db')
    def init_db():
        """Initialize the database and seed data"""
        with app.app_context():
            db.create_all()
            
            # Check if sports already exist
            if Sport.query.count() == 0:
                sports = [
                    Sport(name='Basketball', icon='🏀'),
                    Sport(name='Soccer', icon='⚽'),
                    Sport(name='Tennis', icon='🎾'),
                    Sport(name='Badminton', icon='🏸'),
                    Sport(name='Volleyball', icon='🏐'),
                    Sport(name='Baseball', icon='⚾'),
                    Sport(name='Football', icon='🏈'),
                    Sport(name='Hockey', icon='🏒'),
                    Sport(name='Table Tennis', icon='🏓'),
                    Sport(name='Cricket', icon='🏏'),
                ]
                
                for sport in sports:
                    db.session.add(sport)
                
                db.session.commit()
                print('✅ Database initialized and sports seeded!')
            else:
                print('✅ Database already initialized')
    
    # ==================== ERROR HANDLERS ====================
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f'Internal error: {str(error)}')
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        db.session.rollback()
        return jsonify({'error': 'Database integrity error', 'details': str(error)}), 409
    
    # ==================== HEALTH CHECK ====================
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        }), 200
    
    return app, socketio

# ==================== APP ENTRY POINT ====================

if __name__ == '__main__':
    app, socketio = create_app('development')
    
    with app.app_context():
        db.create_all()
        print('🚀 HopOn Backend starting...')
        print(f'📍 Frontend URL: {app.config["FRONTEND_URL"]}')
        print(f'🔐 Google OAuth configured: {bool(app.config["GOOGLE_CLIENT_ID"])}')
    
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
