#!/usr/bin/env python3
"""
Script to delete a user and all associated data from the database.
Works with both local SQLite and Render PostgreSQL databases.

Usage:
    python delete_user.py daniel
    python delete_user.py 123  (by user ID)
"""

import sys
import os
from app import create_app
from models import db, User, Event, EventParticipant, Follow

def delete_user(identifier):
    """
    Delete a user by username or ID, including all associated data.
    
    Args:
        identifier: Either username (string) or user ID (integer)
    """
    app = create_app()
    
    with app.app_context():
        # Find the user
        user = None
        if isinstance(identifier, int) or identifier.isdigit():
            user = User.query.filter_by(id=int(identifier)).first()
        else:
            user = User.query.filter_by(username=identifier).first()
        
        if not user:
            print(f"Error: User '{identifier}' not found in database")
            return False
        
        print(f"\nFound user: {user.username} (ID: {user.id})")
        print(f"Email: {user.email}")
        
        # Count associated data
        hosted_events = Event.query.filter_by(host_user_id=user.id).count()
        joined_events = EventParticipant.query.filter_by(user_id=user.id).count()
        followers = Follow.query.filter_by(following_id=user.id).count()
        following = Follow.query.filter_by(follower_id=user.id).count()
        
        print(f"\nAssociated data:")
        print(f"  - Events hosted: {hosted_events}")
        print(f"  - Events joined: {joined_events}")
        print(f"  - Followers: {followers}")
        print(f"  - Following: {following}")
        
        # Confirm deletion
        response = input(f"\nAre you sure you want to delete user '{user.username}' and all associated data? (yes/no): ")
        if response.lower() != 'yes':
            print("Deletion cancelled.")
            return False
        
        print("\nDeleting user and associated data...")
        
        try:
            # Delete all follow relationships where user is following someone
            Follow.query.filter_by(follower_id=user.id).delete()
            print(f"  ✓ Deleted {following} follow relationships")
            
            # Delete all follow relationships where someone is following this user
            Follow.query.filter_by(following_id=user.id).delete()
            print(f"  ✓ Deleted {followers} follower relationships")
            
            # Delete event participations
            EventParticipant.query.filter_by(user_id=user.id).delete()
            print(f"  ✓ Deleted {joined_events} event participations")
            
            # Delete hosted events
            Event.query.filter_by(host_user_id=user.id).delete()
            print(f"  ✓ Deleted {hosted_events} hosted events")
            
            # Delete the user
            db.session.delete(user)
            db.session.commit()
            print(f"  ✓ Deleted user '{user.username}'")
            
            print(f"\nUser '{user.username}' and all associated data successfully deleted!")
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"Error during deletion: {e}")
            return False

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python delete_user.py <username_or_id>")
        print("Example: python delete_user.py daniel")
        print("Example: python delete_user.py 5")
        sys.exit(1)
    
    identifier = sys.argv[1]
    success = delete_user(identifier)
    sys.exit(0 if success else 1)
