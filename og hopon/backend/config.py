# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-jwt-secret-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///hopon.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Google OAuth
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:8000/auth/google/callback')
    
    # Frontend
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    
    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = 15 * 60  # 15 minutes
    JWT_REFRESH_TOKEN_EXPIRES = 7 * 24 * 60 * 60  # 7 days
    
    # Google Maps
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')
    
    # Pagination
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Distance
    DEFAULT_RADIUS_KM = 10
    MAX_RADIUS_KM = 50

    @staticmethod
    def validate():
        """Validate required configuration - only in production"""
        if os.environ.get('FLASK_ENV') == 'production':
            required = ['SECRET_KEY', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
            missing = [key for key in required if not os.environ.get(key)]
            if missing:
                raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'

# THIS IS CRITICAL - Must be at the end
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
