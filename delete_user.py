#!/usr/bin/env python3
"""
Script to find and delete a user with malformed sports data from the production database.
Usage: DATABASE_URL="postgresql://..." python3 delete_user.py
"""

import os
import sys
from sqlalchemy import create_engine, text

def delete_user_by_username(username):
    """Find and delete a user by username."""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        print("Usage: DATABASE_URL='postgresql://...' python3 delete_user.py")
        return False
    
    try:
        # Create engine and connect
        engine = create_engine(database_url)
        with engine.connect() as conn:
            # First, find the user
            result = conn.execute(
                text("SELECT id, username, sports FROM user_model WHERE LOWER(username) = LOWER(:username)"),
                {"username": username}
            )
            user = result.fetchone()
            
            if not user:
                print(f"User '{username}' not found")
                return False
            
            user_id, found_username, sports = user
            print(f"Found user: ID={user_id}, Username={found_username}")
            print(f"Sports data: {sports}")
            
            # Confirm deletion
            confirm = input(f"\nDelete user '{found_username}' (ID: {user_id})? (yes/no): ")
            if confirm.lower() != 'yes':
                print("Deletion cancelled")
                return False
            
            # Delete associated event participants
            conn.execute(
                text("DELETE FROM event_participants WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            print(f"  Deleted event participants for user {user_id}")
            
            # Delete events hosted by this user
            conn.execute(
                text("DELETE FROM events WHERE host_user_id = :user_id"),
                {"user_id": user_id}
            )
            print(f"  Deleted events hosted by user {user_id}")
            
            # Delete follow relationships
            conn.execute(
                text("DELETE FROM follows WHERE follower_id = :user_id OR followee_id = :user_id"),
                {"user_id": user_id}
            )
            print(f"  Deleted follow relationships for user {user_id}")
            
            # Delete the user
            conn.execute(
                text("DELETE FROM user_model WHERE id = :user_id"),
                {"user_id": user_id}
            )
            print(f"  Deleted user {found_username} (ID: {user_id})")
            
            conn.commit()
            print(f"\n✅ User '{found_username}' successfully deleted!")
            return True
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def find_users_with_malformed_sports():
    """Find all users with curly braces in sports data."""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        return
    
    try:
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id, username, sports FROM user_model WHERE sports LIKE '%{%' OR sports LIKE '%}%'")
            )
            users = result.fetchall()
            
            if users:
                print("Users with malformed sports data (containing curly braces):")
                for user_id, username, sports in users:
                    print(f"  ID: {user_id}, Username: {username}, Sports: {sports}")
                return users
            else:
                print("No users with malformed sports data found")
                return []
                
    except Exception as e:
        print(f"ERROR: {e}")
        return []

if __name__ == '__main__':
    # First, find all users with malformed sports data
    print("=== Searching for users with malformed sports data ===\n")
    malformed_users = find_users_with_malformed_sports()
    
    if malformed_users:
        print("\n=== Delete User ===\n")
        username = input("Enter username to delete (e.g., 'daniel'): ").strip()
        if username:
            delete_user_by_username(username)
    else:
        print("\nNo cleanup needed - all users have clean sports data!")
