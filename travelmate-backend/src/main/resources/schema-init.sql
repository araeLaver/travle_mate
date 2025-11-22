-- TravelMate Schema Initialization Script
-- This script creates the travelmate schema in the Koyeb PostgreSQL database

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS travelmate;

-- Grant privileges (adjust as needed based on your user permissions)
GRANT ALL PRIVILEGES ON SCHEMA travelmate TO unble;

-- Set search path to include the new schema
SET search_path TO travelmate, public;

-- Comment on schema
COMMENT ON SCHEMA travelmate IS 'TravelMate application schema - Travel companion social platform';
