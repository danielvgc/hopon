# backend/validators.py
"""Input validation schemas using Marshmallow"""
from marshmallow import Schema, fields, validate, validates, ValidationError, EXCLUDE
from datetime import datetime

class EventCreateSchema(Schema):
    """Schema for creating an event"""
    class Meta:
        unknown = EXCLUDE  # Ignore unknown fields
    
    name = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    description = fields.Str(allow_none=True, validate=validate.Length(max=1000))
    sport = fields.Str(required=True, validate=validate.Length(min=2, max=50))
    location = fields.Str(required=True, validate=validate.Length(min=3, max=200))
    latitude = fields.Float(allow_none=True, validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(allow_none=True, validate=validate.Range(min=-180, max=180))
    max_players = fields.Int(required=True, validate=validate.Range(min=2, max=100))
    skill_level = fields.Str(
        allow_none=True,
        validate=validate.OneOf(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    )
    event_date = fields.DateTime(allow_none=True)
    duration_minutes = fields.Int(allow_none=True, validate=validate.Range(min=15, max=480))
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))
    
    @validates('event_date')
    def validate_event_date(self, value):
        """Ensure event date is in the future"""
        if value and value < datetime.utcnow():
            raise ValidationError('Event date must be in the future')

class EventUpdateSchema(Schema):
    """Schema for updating an event"""
    class Meta:
        unknown = EXCLUDE
    
    name = fields.Str(validate=validate.Length(min=3, max=100))
    description = fields.Str(allow_none=True, validate=validate.Length(max=1000))
    location = fields.Str(validate=validate.Length(min=3, max=200))
    latitude = fields.Float(allow_none=True, validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(allow_none=True, validate=validate.Range(min=-180, max=180))
    max_players = fields.Int(validate=validate.Range(min=2, max=100))
    skill_level = fields.Str(
        allow_none=True,
        validate=validate.OneOf(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    )
    event_date = fields.DateTime(allow_none=True)
    duration_minutes = fields.Int(allow_none=True, validate=validate.Range(min=15, max=480))
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))
    status = fields.Str(
        allow_none=True,
        validate=validate.OneOf(['Upcoming', 'Ongoing', 'Completed', 'Cancelled'])
    )

class UserUpdateSchema(Schema):
    """Schema for updating user profile"""
    class Meta:
        unknown = EXCLUDE
    
    name = fields.Str(validate=validate.Length(min=2, max=100))
    bio = fields.Str(allow_none=True, validate=validate.Length(max=500))
    location = fields.Str(allow_none=True, validate=validate.Length(max=200))
    latitude = fields.Float(allow_none=True, validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(allow_none=True, validate=validate.Range(min=-180, max=180))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    sports = fields.List(fields.Int(), allow_none=True)  # List of sport IDs

class RatingCreateSchema(Schema):
    """Schema for creating a rating"""
    class Meta:
        unknown = EXCLUDE
    
    rated_id = fields.Int(required=True)
    event_id = fields.Int(allow_none=True)
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.Str(allow_none=True, validate=validate.Length(max=500))
    
    @validates('rated_id')
    def validate_not_self(self, value):
        """Can't rate yourself"""
        # This will be checked in the endpoint with current user
        pass

class MessageCreateSchema(Schema):
    """Schema for creating a message"""
    class Meta:
        unknown = EXCLUDE
    
    receiver_id = fields.Int(required=True)
    content = fields.Str(required=True, validate=validate.Length(min=1, max=1000))

class EventSearchSchema(Schema):
    """Schema for searching events"""
    class Meta:
        unknown = EXCLUDE
    
    sport = fields.Str(allow_none=True)
    skill_level = fields.Str(
        allow_none=True,
        validate=validate.OneOf(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    )
    latitude = fields.Float(allow_none=True)
    longitude = fields.Float(allow_none=True)
    radius_km = fields.Float(allow_none=True, validate=validate.Range(min=0.1, max=100))
    date_from = fields.DateTime(allow_none=True)
    date_to = fields.DateTime(allow_none=True)
    status = fields.Str(allow_none=True, validate=validate.OneOf(['Upcoming', 'Ongoing', 'Completed', 'Cancelled']))
    page = fields.Int(allow_none=True, validate=validate.Range(min=1))
    per_page = fields.Int(allow_none=True, validate=validate.Range(min=1, max=100))

# Validator instances to use in endpoints
event_create_schema = EventCreateSchema()
event_update_schema = EventUpdateSchema()
user_update_schema = UserUpdateSchema()
rating_create_schema = RatingCreateSchema()
message_create_schema = MessageCreateSchema()
event_search_schema = EventSearchSchema()
