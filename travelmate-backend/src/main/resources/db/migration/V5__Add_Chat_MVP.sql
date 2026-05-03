-- V5: 채팅 MVP - Conversation/Message 테이블 추가
-- 기존 ChatRoom/ChatMessage와 별개로, 1:1 매칭 기반 대화 전용 테이블

-- 1. conversations 테이블 (매칭된 pair 간 대화)
CREATE TABLE IF NOT EXISTS conversations (
    id                BIGSERIAL PRIMARY KEY,
    participant1_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at   TIMESTAMP,
    CONSTRAINT chk_conversation_not_self CHECK (participant1_id <> participant2_id)
);

CREATE INDEX idx_conversations_p1 ON conversations (participant1_id);
CREATE INDEX idx_conversations_p2 ON conversations (participant2_id);
CREATE INDEX idx_conversations_last_message ON conversations (last_message_at DESC NULLS LAST);
CREATE UNIQUE INDEX uq_conversation_pair ON conversations (
    LEAST(participant1_id, participant2_id),
    GREATEST(participant1_id, participant2_id)
);

-- 2. messages 테이블 (conversation 기반 1:1 메시지, isRead 포함)
CREATE TABLE IF NOT EXISTS messages (
    id               BIGSERIAL PRIMARY KEY,
    conversation_id  BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content          TEXT NOT NULL,
    is_read          BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 복합 인덱스: 대화 내 메시지 페이지네이션
CREATE INDEX idx_messages_conv_created ON messages (conversation_id, created_at DESC);
-- 복합 인덱스: 읽지 않은 메시지 수 조회
CREATE INDEX idx_messages_conv_read ON messages (conversation_id, is_read);
