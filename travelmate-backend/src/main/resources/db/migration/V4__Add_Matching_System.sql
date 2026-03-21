-- V4: 동반자 매칭 시스템 테이블 추가

-- 1. users 테이블에 예산 선호도 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_preference VARCHAR(20) DEFAULT 'MEDIUM';

-- 2. match_requests 테이블 생성
CREATE TABLE IF NOT EXISTS match_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_score DECIMAL(5,2),
    travel_style_score DECIMAL(5,2),
    schedule_overlap_score DECIMAL(5,2),
    budget_score DECIMAL(5,2),
    language_score DECIMAL(5,2),
    rating_score DECIMAL(5,2),
    message VARCHAR(500),
    expires_at TIMESTAMP,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_not_self_match CHECK (requester_id != receiver_id)
);

-- 3. 인덱스 생성
CREATE INDEX idx_match_requester_status ON match_requests (requester_id, status);
CREATE INDEX idx_match_receiver_status ON match_requests (receiver_id, status);
CREATE INDEX idx_match_expires_pending ON match_requests (expires_at) WHERE status = 'PENDING';
