#!/usr/bin/env python
"""
Simple test script to verify the Django API endpoints
"""
import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

def test_login():
    """Test the login endpoint"""
    print("Testing login endpoint...")
    
    # Test data
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Login successful!")
            print(f"User: {data.get('user', {}).get('username')}")
            print(f"Role: {data.get('user', {}).get('role')}")
            return data.get('access_token')
        else:
            print(f"Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"Error testing login: {e}")
        return None

def test_protected_endpoint(token):
    """Test a protected endpoint"""
    if not token:
        print("No token available, skipping protected endpoint test")
        return
    
    print("\nTesting protected endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Current user info:")
            print(json.dumps(data, indent=2))
        else:
            print(f"Failed to get user info: {response.text}")
            
    except Exception as e:
        print(f"Error testing protected endpoint: {e}")

def test_clients_endpoint(token):
    """Test the clients endpoint"""
    if not token:
        print("No token available, skipping clients endpoint test")
        return
    
    print("\nTesting clients endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/clients/", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} clients")
        else:
            print(f"Failed to get clients: {response.text}")
            
    except Exception as e:
        print(f"Error testing clients endpoint: {e}")

if __name__ == "__main__":
    print("Django API Test Script")
    print("=" * 50)
    
    # Test login
    token = test_login()
    
    # Test protected endpoints
    test_protected_endpoint(token)
    test_clients_endpoint(token)
    
    print("\nTest completed!")
