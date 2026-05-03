-- Add itinerary tables that are required by the current JPA model.
-- Existing production databases baseline at version 6, so this migration must
-- be safe to apply on both empty Flyway-managed schemas and Hibernate-managed schemas.

CREATE TABLE IF NOT EXISTS travelmate.travel_itineraries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES travelmate.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cover_image VARCHAR(255),
    visibility VARCHAR(255) NOT NULL DEFAULT 'PRIVATE',
    share_code VARCHAR(255),
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    copy_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_travel_itinerary_dates CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_travel_itineraries_share_code
    ON travelmate.travel_itineraries(share_code)
    WHERE share_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_travel_itineraries_user
    ON travelmate.travel_itineraries(user_id);

CREATE INDEX IF NOT EXISTS idx_travel_itineraries_visibility
    ON travelmate.travel_itineraries(visibility);

CREATE INDEX IF NOT EXISTS idx_travel_itineraries_dates
    ON travelmate.travel_itineraries(start_date, end_date);

CREATE TABLE IF NOT EXISTS travelmate.itinerary_items (
    id BIGSERIAL PRIMARY KEY,
    itinerary_id BIGINT NOT NULL REFERENCES travelmate.travel_itineraries(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    notes TEXT,
    place_name VARCHAR(255),
    place_address VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    google_place_id VARCHAR(255),
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    estimated_cost DOUBLE PRECISION,
    actual_cost DOUBLE PRECISION,
    currency VARCHAR(255),
    booking_reference VARCHAR(255),
    booking_url VARCHAR(255),
    booking_status VARCHAR(255),
    image_url VARCHAR(255),
    location_collection_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary
    ON travelmate.itinerary_items(itinerary_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_items_order
    ON travelmate.itinerary_items(itinerary_id, day_number, order_index);

CREATE TABLE IF NOT EXISTS travelmate.itinerary_collaborators (
    id BIGSERIAL PRIMARY KEY,
    itinerary_id BIGINT NOT NULL REFERENCES travelmate.travel_itineraries(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES travelmate.users(id) ON DELETE CASCADE,
    role VARCHAR(255) NOT NULL DEFAULT 'VIEWER',
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    invited_by BIGINT REFERENCES travelmate.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    CONSTRAINT uk_itinerary_collaborator_user UNIQUE (itinerary_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_collaborators_itinerary
    ON travelmate.itinerary_collaborators(itinerary_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_collaborators_user
    ON travelmate.itinerary_collaborators(user_id);

CREATE TABLE IF NOT EXISTS travelmate.itinerary_comments (
    id BIGSERIAL PRIMARY KEY,
    itinerary_id BIGINT NOT NULL REFERENCES travelmate.travel_itineraries(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES travelmate.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES travelmate.itinerary_comments(id) ON DELETE CASCADE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_itinerary_comment_itinerary
    ON travelmate.itinerary_comments(itinerary_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_comment_user
    ON travelmate.itinerary_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_comment_parent
    ON travelmate.itinerary_comments(parent_id);

CREATE TABLE IF NOT EXISTS travelmate.itinerary_likes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES travelmate.users(id) ON DELETE CASCADE,
    itinerary_id BIGINT NOT NULL REFERENCES travelmate.travel_itineraries(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_itinerary_like_user_itinerary UNIQUE (user_id, itinerary_id)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_likes_user
    ON travelmate.itinerary_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_likes_itinerary
    ON travelmate.itinerary_likes(itinerary_id);
