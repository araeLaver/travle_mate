-- V2: Add Performance Indexes for TravelMate Application
-- Guarded for PostgreSQL fresh installs where older entity generations may not
-- have created every table or column referenced by this legacy migration.

CREATE OR REPLACE FUNCTION pg_temp.create_index_if_columns_exist(
    target_schema text,
    target_table text,
    required_columns text[],
    index_ddl text
) RETURNS void AS $$
DECLARE
    missing_column text;
BEGIN
    IF to_regclass(format('%I.%I', target_schema, target_table)) IS NULL THEN
        RETURN;
    END IF;

    SELECT required.column_name
      INTO missing_column
      FROM unnest(required_columns) AS required(column_name)
     WHERE NOT EXISTS (
           SELECT 1
             FROM information_schema.columns AS c
            WHERE c.table_schema = target_schema
              AND c.table_name = target_table
              AND c.column_name = required.column_name
     )
     LIMIT 1;

    IF missing_column IS NULL THEN
        EXECUTE index_ddl;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pg_temp.comment_on_index_if_exists(
    target_schema text,
    index_name text,
    index_comment text
) RETURNS void AS $$
BEGIN
    IF to_regclass(format('%I.%I', target_schema, index_name)) IS NOT NULL THEN
        EXECUTE format('COMMENT ON INDEX %I.%I IS %L', target_schema, index_name, index_comment);
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'users', ARRAY['email'], 'CREATE INDEX IF NOT EXISTS idx_user_email ON travelmate.users(email)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'users', ARRAY['nickname'], 'CREATE INDEX IF NOT EXISTS idx_user_nickname ON travelmate.users(nickname)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'users', ARRAY['current_latitude', 'current_longitude', 'is_location_enabled'], 'CREATE INDEX IF NOT EXISTS idx_user_location ON travelmate.users(current_latitude, current_longitude) WHERE is_location_enabled = true');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'users', ARRAY['is_active', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_user_active ON travelmate.users(is_active, created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'users', ARRAY['rating'], 'CREATE INDEX IF NOT EXISTS idx_user_rating ON travelmate.users(rating DESC) WHERE rating IS NOT NULL');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'users', ARRAY['is_matching_enabled', 'is_location_enabled', 'is_active'], 'CREATE INDEX IF NOT EXISTS idx_user_matching ON travelmate.users(is_matching_enabled, is_location_enabled, is_active) WHERE is_matching_enabled = true AND is_location_enabled = true AND is_active = true');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'travel_groups', ARRAY['status'], 'CREATE INDEX IF NOT EXISTS idx_travel_group_status ON travelmate.travel_groups(status)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'travel_groups', ARRAY['destination_latitude', 'destination_longitude'], 'CREATE INDEX IF NOT EXISTS idx_travel_group_location ON travelmate.travel_groups(destination_latitude, destination_longitude)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'travel_groups', ARRAY['start_date', 'end_date'], 'CREATE INDEX IF NOT EXISTS idx_travel_group_dates ON travelmate.travel_groups(start_date, end_date)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'travel_groups', ARRAY['creator_id'], 'CREATE INDEX IF NOT EXISTS idx_travel_group_creator ON travelmate.travel_groups(creator_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'travel_groups', ARRAY['status', 'start_date', 'end_date'], 'CREATE INDEX IF NOT EXISTS idx_group_active ON travelmate.travel_groups(status, start_date, end_date) WHERE status = ''ACTIVE''');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'group_members', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_group_member_user ON travelmate.group_members(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'group_members', ARRAY['group_id'], 'CREATE INDEX IF NOT EXISTS idx_group_member_group ON travelmate.group_members(group_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'group_members', ARRAY['status'], 'CREATE INDEX IF NOT EXISTS idx_group_member_status ON travelmate.group_members(status)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'group_members', ARRAY['group_id', 'user_id', 'status'], 'CREATE INDEX IF NOT EXISTS idx_group_member_composite ON travelmate.group_members(group_id, user_id, status)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chats', ARRAY['group_id'], 'CREATE INDEX IF NOT EXISTS idx_chat_group ON travelmate.chats(group_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chats', ARRAY['created_at'], 'CREATE INDEX IF NOT EXISTS idx_chat_created ON travelmate.chats(created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chats', ARRAY['chat_type'], 'CREATE INDEX IF NOT EXISTS idx_chat_type ON travelmate.chats(chat_type)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chat_messages', ARRAY['chat_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_chat_message_chat ON travelmate.chat_messages(chat_id, created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chat_messages', ARRAY['sender_id'], 'CREATE INDEX IF NOT EXISTS idx_chat_message_sender ON travelmate.chat_messages(sender_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chat_messages', ARRAY['message_type'], 'CREATE INDEX IF NOT EXISTS idx_chat_message_type ON travelmate.chat_messages(message_type)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chat_participants', ARRAY['chat_id'], 'CREATE INDEX IF NOT EXISTS idx_chat_participant_chat ON travelmate.chat_participants(chat_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chat_participants', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_chat_participant_user ON travelmate.chat_participants(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'chat_participants', ARRAY['chat_id', 'user_id'], 'CREATE INDEX IF NOT EXISTS idx_chat_participant_composite ON travelmate.chat_participants(chat_id, user_id)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'posts', ARRAY['author_id'], 'CREATE INDEX IF NOT EXISTS idx_post_author ON travelmate.posts(author_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'posts', ARRAY['created_at'], 'CREATE INDEX IF NOT EXISTS idx_post_created ON travelmate.posts(created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'posts', ARRAY['category'], 'CREATE INDEX IF NOT EXISTS idx_post_category ON travelmate.posts(category)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'posts', ARRAY['status'], 'CREATE INDEX IF NOT EXISTS idx_post_status ON travelmate.posts(status)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'posts', ARRAY['location'], 'CREATE INDEX IF NOT EXISTS idx_post_location ON travelmate.posts(location)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'post_likes', ARRAY['post_id'], 'CREATE INDEX IF NOT EXISTS idx_post_like_post ON travelmate.post_likes(post_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'post_likes', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_post_like_user ON travelmate.post_likes(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'post_likes', ARRAY['post_id', 'user_id'], 'CREATE INDEX IF NOT EXISTS idx_post_like_composite ON travelmate.post_likes(post_id, user_id)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'comments', ARRAY['post_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_comment_post ON travelmate.comments(post_id, created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'comments', ARRAY['author_id'], 'CREATE INDEX IF NOT EXISTS idx_comment_author ON travelmate.comments(author_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'comments', ARRAY['parent_comment_id'], 'CREATE INDEX IF NOT EXISTS idx_comment_parent ON travelmate.comments(parent_comment_id)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_reviews', ARRAY['reviewee_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_user_review_reviewee ON travelmate.user_reviews(reviewee_id, created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_reviews', ARRAY['reviewer_id'], 'CREATE INDEX IF NOT EXISTS idx_user_review_reviewer ON travelmate.user_reviews(reviewer_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_reviews', ARRAY['rating'], 'CREATE INDEX IF NOT EXISTS idx_user_review_rating ON travelmate.user_reviews(rating DESC)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'match_requests', ARRAY['sender_id'], 'CREATE INDEX IF NOT EXISTS idx_match_request_sender ON travelmate.match_requests(sender_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'match_requests', ARRAY['receiver_id'], 'CREATE INDEX IF NOT EXISTS idx_match_request_receiver ON travelmate.match_requests(receiver_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'match_requests', ARRAY['status'], 'CREATE INDEX IF NOT EXISTS idx_match_request_status ON travelmate.match_requests(status)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'match_requests', ARRAY['receiver_id', 'status', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_match_request_composite ON travelmate.match_requests(receiver_id, status, created_at DESC)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'notifications', ARRAY['user_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_notification_user ON travelmate.notifications(user_id, created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'notifications', ARRAY['user_id', 'is_read', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_notification_read ON travelmate.notifications(user_id, is_read, created_at DESC)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'refresh_tokens', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON travelmate.refresh_tokens(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'refresh_tokens', ARRAY['expires_at'], 'CREATE INDEX IF NOT EXISTS idx_refresh_token_expiry ON travelmate.refresh_tokens(expires_at)');

SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_user_email', '이메일 조회 성능 향상');
SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_user_nickname', '닉네임 중복 체크 성능 향상');
SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_user_location', '주변 사용자 검색 성능 향상');
SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_chat_message_chat', '채팅 메시지 조회 성능 향상');
SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_user_matching', '매칭 가능한 사용자 검색 성능 향상');
