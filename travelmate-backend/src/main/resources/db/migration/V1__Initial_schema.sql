-- TravelMate 초기 스키마 생성
-- Flyway 마이그레이션 파일

-- 사용자 테이블
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    bio TEXT,
    profile_image_url VARCHAR(500),
    travel_style VARCHAR(50),
    interests TEXT[], -- PostgreSQL 배열 타입
    languages TEXT[],
    location_latitude DOUBLE PRECISION,
    location_longitude DOUBLE PRECISION,
    fcm_token VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    is_location_enabled BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 여행 그룹 테이블
CREATE TABLE travel_groups (
    id BIGSERIAL PRIMARY KEY,
    creator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    destination VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_members INTEGER NOT NULL DEFAULT 10,
    current_members INTEGER DEFAULT 1,
    travel_style VARCHAR(50),
    budget_range VARCHAR(50),
    group_image_url VARCHAR(500),
    meeting_location VARCHAR(200),
    requirements TEXT,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_dates CHECK (end_date >= start_date),
    CONSTRAINT check_max_members CHECK (max_members > 0),
    CONSTRAINT check_current_members CHECK (current_members >= 0)
);

-- 그룹 멤버 테이블
CREATE TABLE group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES travel_groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER', -- CREATOR, ADMIN, MEMBER
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(group_id, user_id)
);

-- 채팅방 테이블
CREATE TABLE chat_rooms (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT REFERENCES travel_groups(id) ON DELETE CASCADE,
    name VARCHAR(200),
    type VARCHAR(20) DEFAULT 'GROUP', -- GROUP, PRIVATE
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 채팅 메시지 테이블
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT', -- TEXT, IMAGE, FILE, SYSTEM
    file_url VARCHAR(500),
    file_name VARCHAR(200),
    file_size BIGINT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 메시지 읽음 상태 테이블
CREATE TABLE message_read_status (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(message_id, user_id)
);

-- 사용자 리뷰 테이블
CREATE TABLE user_reviews (
    id BIGSERIAL PRIMARY KEY,
    reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id BIGINT REFERENCES travel_groups(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(reviewer_id, reviewed_user_id, group_id)
);

-- 매칭 기록 테이블
CREATE TABLE match_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    matched_group_id BIGINT REFERENCES travel_groups(id) ON DELETE CASCADE,
    match_type VARCHAR(20) NOT NULL, -- SHAKE, SMART, GROUP
    match_score DECIMAL(5,2),
    location_latitude DOUBLE PRECISION,
    location_longitude DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CHECK ((matched_user_id IS NOT NULL AND matched_group_id IS NULL) OR 
           (matched_user_id IS NULL AND matched_group_id IS NOT NULL))
);

-- 신고 테이블
CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    reported_group_id BIGINT REFERENCES travel_groups(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- HARASSMENT, SPAM, INAPPROPRIATE_CONTENT, FAKE_PROFILE
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, INVESTIGATING, RESOLVED, DISMISSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    CHECK ((reported_user_id IS NOT NULL AND reported_group_id IS NULL) OR 
           (reported_user_id IS NULL AND reported_group_id IS NOT NULL))
);

-- 알림 테이블
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- MATCH_REQUEST, GROUP_INVITE, MESSAGE, SYSTEM
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    data JSONB, -- 추가 메타데이터 (JSON 형태)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_location ON users(location_latitude, location_longitude) WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_travel_groups_creator_id ON travel_groups(creator_id);
CREATE INDEX idx_travel_groups_destination ON travel_groups(destination);
CREATE INDEX idx_travel_groups_dates ON travel_groups(start_date, end_date);
CREATE INDEX idx_travel_groups_active ON travel_groups(is_active) WHERE is_active = true;
CREATE INDEX idx_travel_groups_public ON travel_groups(is_public) WHERE is_public = true;
CREATE INDEX idx_travel_groups_created_at ON travel_groups(created_at);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_status ON group_members(status);

CREATE INDEX idx_chat_rooms_group_id ON chat_rooms(group_id);
CREATE INDEX idx_chat_rooms_active ON chat_rooms(is_active) WHERE is_active = true;

CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_active ON chat_messages(is_deleted) WHERE is_deleted = false;

CREATE INDEX idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX idx_message_read_status_user_id ON message_read_status(user_id);

CREATE INDEX idx_user_reviews_reviewer_id ON user_reviews(reviewer_id);
CREATE INDEX idx_user_reviews_reviewed_user_id ON user_reviews(reviewed_user_id);
CREATE INDEX idx_user_reviews_group_id ON user_reviews(group_id);

CREATE INDEX idx_match_history_user_id ON match_history(user_id);
CREATE INDEX idx_match_history_matched_user_id ON match_history(matched_user_id);
CREATE INDEX idx_match_history_matched_group_id ON match_history(matched_group_id);
CREATE INDEX idx_match_history_type ON match_history(match_type);
CREATE INDEX idx_match_history_status ON match_history(status);
CREATE INDEX idx_match_history_created_at ON match_history(created_at);
CREATE INDEX idx_match_history_location ON match_history(location_latitude, location_longitude) WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 전문 검색 인덱스 (PostgreSQL Full-Text Search)
CREATE INDEX idx_travel_groups_search ON travel_groups USING gin(to_tsvector('korean', title || ' ' || description || ' ' || destination));
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('korean', username || ' ' || full_name || ' ' || COALESCE(bio, '')));