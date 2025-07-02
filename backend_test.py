#!/usr/bin/env python3
import requests
import json
import random
import string
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get the backend URL from environment variables
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL')
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    sys.exit(1)

# Ensure the URL doesn't end with a slash
if BACKEND_URL.endswith('/'):
    BACKEND_URL = BACKEND_URL[:-1]

# Add the /api prefix
API_URL = f"{BACKEND_URL}/api"

print(f"Using API URL: {API_URL}")

# Test data
test_user = {
    "email": f"test.user.{random.randint(1000, 9999)}@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
}

# Store auth token
auth_token = None

def print_separator():
    print("\n" + "="*80 + "\n")

def test_health_check():
    print("Testing Health Check Endpoint...")
    response = requests.get(f"{API_URL}/health")
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    
    print("✅ Health Check Test Passed")
    return True

def test_user_registration():
    global auth_token
    print("Testing User Registration Endpoint...")
    
    # Create registration data
    registration_data = {
        "email": test_user["email"],
        "password": test_user["password"],
        "name": test_user["name"],
        "gdpr_consent": True,
        "marketing_consent": False
    }
    
    response = requests.post(
        f"{API_URL}/auth/register",
        json=registration_data
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["user"]["email"] == test_user["email"]
    assert response.json()["user"]["name"] == test_user["name"]
    
    # Store the auth token for subsequent tests
    auth_token = response.json()["access_token"]
    
    print("✅ User Registration Test Passed")
    return True

def test_user_login():
    global auth_token
    print("Testing User Login Endpoint...")
    
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    
    response = requests.post(
        f"{API_URL}/auth/login",
        json=login_data
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["user"]["email"] == test_user["email"]
    
    # Update the auth token
    auth_token = response.json()["access_token"]
    
    print("✅ User Login Test Passed")
    return True

def test_get_user_info():
    print("Testing Get User Info Endpoint...")
    
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    
    response = requests.get(
        f"{API_URL}/auth/me",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert response.json()["email"] == test_user["email"]
    assert response.json()["name"] == test_user["name"]
    
    print("✅ Get User Info Test Passed")
    return True

def test_get_payment_packages():
    print("Testing Payment Packages Endpoint...")
    
    response = requests.get(f"{API_URL}/payment/packages")
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    
    # Verify the pricing structure
    packages = response.json()
    assert "corso_completo" in packages
    assert packages["corso_completo"]["price"] == 79.99
    assert packages["corso_completo"]["currency"] == "EUR"
    
    assert "powerpoint_strategie" in packages
    assert packages["powerpoint_strategie"]["price"] == 10.99
    
    assert "video_strategia" in packages
    assert packages["video_strategia"]["price"] == 14.99
    
    assert "powerpoint_nicchia" in packages
    assert packages["powerpoint_nicchia"]["price"] == 17.99
    
    print("✅ Payment Packages Test Passed")
    return True

def test_get_free_content():
    print("Testing Free Content Endpoint...")
    
    response = requests.get(f"{API_URL}/courses/free")
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert "content" in response.json()
    
    print("✅ Free Content Test Passed")
    return True

def test_booking_request():
    print("Testing Booking Request Endpoint...")
    
    booking_data = {
        "user_email": test_user["email"],
        "preferred_date": "2025-06-15",
        "preferred_time": "14:00",
        "notes": "Test booking for video lesson"
    }
    
    response = requests.post(
        f"{API_URL}/bookings/request",
        json=booking_data
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert "booking_id" in response.json()
    assert "message" in response.json()
    
    print("✅ Booking Request Test Passed")
    return True

def test_get_my_bookings():
    print("Testing Get My Bookings Endpoint...")
    
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    
    response = requests.get(
        f"{API_URL}/bookings/my",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert "bookings" in response.json()
    
    # Check if our booking is in the list
    bookings = response.json()["bookings"]
    found = False
    for booking in bookings:
        if booking["user_email"] == test_user["email"]:
            found = True
            break
    
    assert found, "Booking not found in user's bookings"
    
    print("✅ Get My Bookings Test Passed")
    return True

def run_all_tests():
    tests = [
        ("Health Check", test_health_check),
        ("User Registration", test_user_registration),
        ("User Login", test_user_login),
        ("Get User Info", test_get_user_info),
        ("Payment Packages", test_get_payment_packages),
        ("Free Content", test_get_free_content),
        ("Booking Request", test_booking_request),
        ("Get My Bookings", test_get_my_bookings)
    ]
    
    results = {}
    all_passed = True
    
    for name, test_func in tests:
        print_separator()
        try:
            result = test_func()
            results[name] = "PASSED" if result else "FAILED"
            if not result:
                all_passed = False
        except Exception as e:
            print(f"❌ Test Failed with Exception: {str(e)}")
            results[name] = f"FAILED: {str(e)}"
            all_passed = False
    
    print_separator()
    print("TEST SUMMARY:")
    for name, result in results.items():
        status = "✅" if "PASSED" in result else "❌"
        print(f"{status} {name}: {result}")
    
    print_separator()
    if all_passed:
        print("🎉 All tests passed successfully!")
    else:
        print("❌ Some tests failed. Please check the summary above.")
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()