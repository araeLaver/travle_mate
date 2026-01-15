-- TravelMate Database Initialization Script
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE travelmate TO travelmate_user;

-- Create indexes for better performance (optional - JPA will create basic indexes)
-- These are additional indexes for full-text search and geolocation

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'TravelMate database initialized successfully';
END $$;
