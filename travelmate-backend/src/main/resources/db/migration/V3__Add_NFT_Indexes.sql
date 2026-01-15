-- V3: Add NFT and Follow Related Indexes

-- UserFollow 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_follow_follower ON travelmate.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follow_following ON travelmate.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follow_composite ON travelmate.user_follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_user_follow_created ON travelmate.user_follows(created_at DESC);

-- CollectibleLocation 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_collectible_location_coords ON travelmate.collectible_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_collectible_location_active ON travelmate.collectible_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_collectible_location_rarity ON travelmate.collectible_locations(rarity);
CREATE INDEX IF NOT EXISTS idx_collectible_location_region ON travelmate.collectible_locations(region);
CREATE INDEX IF NOT EXISTS idx_collectible_location_active_coords ON travelmate.collectible_locations(latitude, longitude)
    WHERE is_active = true;

-- UserNftCollection 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_nft_collection_user ON travelmate.user_nft_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_collection_location ON travelmate.user_nft_collections(location_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_collection_collected ON travelmate.user_nft_collections(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_nft_collection_minted ON travelmate.user_nft_collections(is_minted);
CREATE INDEX IF NOT EXISTS idx_user_nft_collection_user_location ON travelmate.user_nft_collections(user_id, location_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_collection_mint_status ON travelmate.user_nft_collections(mint_status);

-- LocationReview 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_location_review_location ON travelmate.location_reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_location_review_user ON travelmate.location_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_location_review_rating ON travelmate.location_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_location_review_created ON travelmate.location_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_review_helpful ON travelmate.location_reviews(helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_location_review_location_created ON travelmate.location_reviews(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_review_location_helpful ON travelmate.location_reviews(location_id, helpful_count DESC);

-- ReviewHelpful 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON travelmate.review_helpfuls(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_user ON travelmate.review_helpfuls(user_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_composite ON travelmate.review_helpfuls(review_id, user_id);

-- NftMarketplaceListing 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_nft_listing_seller ON travelmate.nft_marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_nft_listing_nft ON travelmate.nft_marketplace_listings(nft_collection_id);
CREATE INDEX IF NOT EXISTS idx_nft_listing_status ON travelmate.nft_marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_nft_listing_price ON travelmate.nft_marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_nft_listing_created ON travelmate.nft_marketplace_listings(created_at DESC);

-- PointTransaction 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_point_transaction_user ON travelmate.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transaction_type ON travelmate.point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transaction_created ON travelmate.point_transactions(created_at DESC);

-- UserPoint 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_point_user ON travelmate.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_point_total ON travelmate.user_points(total_points DESC);

-- UserAchievement 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_achievement_user ON travelmate.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievement_achievement ON travelmate.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievement_earned ON travelmate.user_achievements(earned_at DESC);

-- 복합 인덱스 (팔로우 통계용)
CREATE INDEX IF NOT EXISTS idx_user_follow_stats_following ON travelmate.user_follows(following_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_follow_stats_follower ON travelmate.user_follows(follower_id, created_at DESC);

-- 인덱스 코멘트
COMMENT ON INDEX travelmate.idx_user_follow_composite IS '팔로우 관계 조회 성능 향상';
COMMENT ON INDEX travelmate.idx_collectible_location_active_coords IS '활성화된 NFT 위치 검색 성능 향상';
COMMENT ON INDEX travelmate.idx_location_review_location_created IS '장소별 최신 리뷰 조회 성능 향상';
COMMENT ON INDEX travelmate.idx_location_review_location_helpful IS '장소별 도움됨 순 리뷰 조회 성능 향상';
