#!/usr/bin/env python3
"""
Script to delete a user from the production database via the backend API.
Works with the running backend on Render.

Usage:
    python delete_user_via_api.py daniel https://hopon-backend.onrender.com
    python delete_user_via_api.py 123 https://hopon-backend.onrender.com
"""

import sys
import requests
import json

def delete_user_via_api(identifier, backend_url):
    """
    Delete a user via the backend API.
    
    Args:
        identifier: Either username (string) or user ID (integer)
        backend_url: Backend URL (e.g., https://hopon-backend.onrender.com)
    """
    # Ensure backend URL doesn't have trailing slash
    backend_url = backend_url.rstrip('/')
    
    print(f"Connecting to backend: {backend_url}")
    print(f"Deleting user: {identifier}")
    
    try:
        # Call the delete endpoint
        response = requests.post(
            f"{backend_url}/admin/users/delete",
            json={"identifier": identifier},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✓ User successfully deleted!")
            print(f"  Deleted: {result.get('username', 'unknown')}")
            print(f"  Associated data removed:")
            print(f"    - Follow relationships: {result.get('follows_deleted', 0)}")
            print(f"    - Event participations: {result.get('participations_deleted', 0)}")
            print(f"    - Hosted events: {result.get('events_deleted', 0)}")
            return True
        elif response.status_code == 404:
            print(f"Error: User '{identifier}' not found")
            return False
        elif response.status_code == 401:
            print("Error: Unauthorized. Admin credentials required.")
            print("Note: This endpoint requires admin authentication")
            return False
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to {backend_url}")
        print("Make sure the backend is running and the URL is correct")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python delete_user_via_api.py <username_or_id> <backend_url>")
        print("Example: python delete_user_via_api.py daniel https://hopon-backend.onrender.com")
        print("Example (local): python delete_user_via_api.py daniel http://localhost:8000")
        sys.exit(1)
    
    identifier = sys.argv[1]
    backend_url = sys.argv[2]
    
    success = delete_user_via_api(identifier, backend_url)
    sys.exit(0 if success else 1)
