-- V3: Add NFT and Follow Related Indexes
-- Guarded so legacy optional tables can be introduced independently.

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

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_follows', ARRAY['follower_id'], 'CREATE INDEX IF NOT EXISTS idx_user_follow_follower ON travelmate.user_follows(follower_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_follows', ARRAY['following_id'], 'CREATE INDEX IF NOT EXISTS idx_user_follow_following ON travelmate.user_follows(following_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_follows', ARRAY['follower_id', 'following_id'], 'CREATE INDEX IF NOT EXISTS idx_user_follow_composite ON travelmate.user_follows(follower_id, following_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_follows', ARRAY['created_at'], 'CREATE INDEX IF NOT EXISTS idx_user_follow_created ON travelmate.user_follows(created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_follows', ARRAY['following_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_user_follow_stats_following ON travelmate.user_follows(following_id, created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_follows', ARRAY['follower_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_user_follow_stats_follower ON travelmate.user_follows(follower_id, created_at DESC)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'collectible_locations', ARRAY['latitude', 'longitude'], 'CREATE INDEX IF NOT EXISTS idx_collectible_location_coords ON travelmate.collectible_locations(latitude, longitude)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'collectible_locations', ARRAY['is_active'], 'CREATE INDEX IF NOT EXISTS idx_collectible_location_active ON travelmate.collectible_locations(is_active)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'collectible_locations', ARRAY['rarity'], 'CREATE INDEX IF NOT EXISTS idx_collectible_location_rarity ON travelmate.collectible_locations(rarity)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'collectible_locations', ARRAY['region'], 'CREATE INDEX IF NOT EXISTS idx_collectible_location_region ON travelmate.collectible_locations(region)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'collectible_locations', ARRAY['latitude', 'longitude', 'is_active'], 'CREATE INDEX IF NOT EXISTS idx_collectible_location_active_coords ON travelmate.collectible_locations(latitude, longitude) WHERE is_active = true');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_nft_collections', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_user_nft_collection_user ON travelmate.user_nft_collections(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_nft_collections', ARRAY['location_id'], 'CREATE INDEX IF NOT EXISTS idx_user_nft_collection_location ON travelmate.user_nft_collections(location_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_nft_collections', ARRAY['collected_at'], 'CREATE INDEX IF NOT EXISTS idx_user_nft_collection_collected ON travelmate.user_nft_collections(collected_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_nft_collections', ARRAY['is_minted'], 'CREATE INDEX IF NOT EXISTS idx_user_nft_collection_minted ON travelmate.user_nft_collections(is_minted)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_nft_collections', ARRAY['user_id', 'location_id'], 'CREATE INDEX IF NOT EXISTS idx_user_nft_collection_user_location ON travelmate.user_nft_collections(user_id, location_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_nft_collections', ARRAY['mint_status'], 'CREATE INDEX IF NOT EXISTS idx_user_nft_collection_mint_status ON travelmate.user_nft_collections(mint_status)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'location_reviews', ARRAY['location_id'], 'CREATE INDEX IF NOT EXISTS idx_location_review_location ON travelmate.location_reviews(location_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'location_reviews', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_location_review_user ON travelmate.location_reviews(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'location_reviews', ARRAY['rating'], 'CREATE INDEX IF NOT EXISTS idx_location_review_rating ON travelmate.location_reviews(rating)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'location_reviews', ARRAY['created_at'], 'CREATE INDEX IF NOT EXISTS idx_location_review_created ON travelmate.location_reviews(created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'location_reviews', ARRAY['helpful_count'], 'CREATE INDEX IF NOT EXISTS idx_location_review_helpful ON travelmate.location_reviews(helpful_count DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'location_reviews', ARRAY['location_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_location_review_location_created ON travelmate.location_reviews(location_id, created_at DESC)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'location_reviews', ARRAY['location_id', 'helpful_count'], 'CREATE INDEX IF NOT EXISTS idx_location_review_location_helpful ON travelmate.location_reviews(location_id, helpful_count DESC)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'review_helpfuls', ARRAY['review_id'], 'CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON travelmate.review_helpfuls(review_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'review_helpfuls', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_review_helpful_user ON travelmate.review_helpfuls(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'review_helpfuls', ARRAY['review_id', 'user_id'], 'CREATE INDEX IF NOT EXISTS idx_review_helpful_composite ON travelmate.review_helpfuls(review_id, user_id)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'nft_marketplace_listings', ARRAY['seller_id'], 'CREATE INDEX IF NOT EXISTS idx_nft_listing_seller ON travelmate.nft_marketplace_listings(seller_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'nft_marketplace_listings', ARRAY['nft_collection_id'], 'CREATE INDEX IF NOT EXISTS idx_nft_listing_nft ON travelmate.nft_marketplace_listings(nft_collection_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'nft_marketplace_listings', ARRAY['status'], 'CREATE INDEX IF NOT EXISTS idx_nft_listing_status ON travelmate.nft_marketplace_listings(status)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'nft_marketplace_listings', ARRAY['price'], 'CREATE INDEX IF NOT EXISTS idx_nft_listing_price ON travelmate.nft_marketplace_listings(price)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'nft_marketplace_listings', ARRAY['created_at'], 'CREATE INDEX IF NOT EXISTS idx_nft_listing_created ON travelmate.nft_marketplace_listings(created_at DESC)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'point_transactions', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_point_transaction_user ON travelmate.point_transactions(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'point_transactions', ARRAY['type'], 'CREATE INDEX IF NOT EXISTS idx_point_transaction_type ON travelmate.point_transactions(type)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'point_transactions', ARRAY['created_at'], 'CREATE INDEX IF NOT EXISTS idx_point_transaction_created ON travelmate.point_transactions(created_at DESC)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_points', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_user_point_user ON travelmate.user_points(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_points', ARRAY['total_points'], 'CREATE INDEX IF NOT EXISTS idx_user_point_total ON travelmate.user_points(total_points DESC)');

SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_achievements', ARRAY['user_id'], 'CREATE INDEX IF NOT EXISTS idx_user_achievement_user ON travelmate.user_achievements(user_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_achievements', ARRAY['achievement_id'], 'CREATE INDEX IF NOT EXISTS idx_user_achievement_achievement ON travelmate.user_achievements(achievement_id)');
SELECT pg_temp.create_index_if_columns_exist('travelmate', 'user_achievements', ARRAY['earned_at'], 'CREATE INDEX IF NOT EXISTS idx_user_achievement_earned ON travelmate.user_achievements(earned_at DESC)');

SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_user_follow_composite', '팔로우 관계 조회 성능 향상');
SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_collectible_location_active_coords', '활성화된 NFT 위치 검색 성능 향상');
SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_location_review_location_created', '장소별 최신 리뷰 조회 성능 향상');
SELECT pg_temp.comment_on_index_if_exists('travelmate', 'idx_location_review_location_helpful', '장소별 도움됨 순 리뷰 조회 성능 향상');
