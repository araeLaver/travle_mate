-- V6: Trust & Safety System
-- 신뢰 점수, 긴급 연락처 테이블 추가

-- 사용자 신뢰 점수
CREATE TABLE IF NOT EXISTS user_trust_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    base_score INTEGER NOT NULL DEFAULT 50,
    review_score INTEGER NOT NULL DEFAULT 0,
    activity_score INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 50,
    trust_badge VARCHAR(20) NOT NULL DEFAULT 'NEW',
    last_calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_trust_score_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_trust_scores_total ON user_trust_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_trust_scores_badge ON user_trust_scores(trust_badge);

-- 긴급 연락처
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);
