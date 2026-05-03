-- Align fresh Flyway-managed PostgreSQL schemas with the current Hibernate model.
-- This migration is post-baseline so existing Hibernate-managed production DBs
-- that baseline at version 6 can still apply it safely.

CREATE TABLE IF NOT EXISTS travelmate.achievements (
    id BIGSERIAL NOT NULL,
    badge_image_url character varying(500),
    code character varying(50) NOT NULL,
    condition_json text,
    created_at timestamp(6) without time zone,
    description text,
    display_order integer,
    grants_badge_nft boolean NOT NULL,
    icon_url character varying(500),
    is_active boolean NOT NULL,
    name character varying(100) NOT NULL,
    point_reward integer NOT NULL,
    rarity character varying(20) NOT NULL,
    target_count integer,
    type character varying(20) NOT NULL,
    CONSTRAINT achievements_rarity_check CHECK (((rarity)::text = ANY ((ARRAY['COMMON'::character varying, 'RARE'::character varying, 'EPIC'::character varying, 'LEGENDARY'::character varying])::text[]))),
    CONSTRAINT achievements_type_check CHECK (((type)::text = ANY ((ARRAY['COLLECTION'::character varying, 'REGION'::character varying, 'ACTIVITY'::character varying, 'SPECIAL'::character varying, 'SEASONAL'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.activities (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    is_public boolean NOT NULL,
    metadata character varying(2000),
    target_id bigint,
    target_type character varying(50),
    type character varying(255) NOT NULL,
    actor_id bigint NOT NULL,
    CONSTRAINT activities_type_check CHECK (((type)::text = ANY ((ARRAY['POST_CREATED'::character varying, 'POST_LIKED'::character varying, 'POST_COMMENTED'::character varying, 'POST_SHARED'::character varying, 'USER_FOLLOWED'::character varying, 'USER_JOINED'::character varying, 'NFT_COLLECTED'::character varying, 'NFT_MINTED'::character varying, 'NFT_LISTED'::character varying, 'NFT_SOLD'::character varying, 'NFT_PURCHASED'::character varying, 'REVIEW_CREATED'::character varying, 'REVIEW_HELPFUL'::character varying, 'ACHIEVEMENT_UNLOCKED'::character varying, 'LEVEL_UP'::character varying, 'GROUP_JOINED'::character varying, 'GROUP_CREATED'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.auction_bids (
    id BIGSERIAL NOT NULL,
    bid_amount bigint NOT NULL,
    bid_at timestamp(6) without time zone,
    is_winning boolean,
    auction_id bigint NOT NULL,
    bidder_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.beta_config (
    config_key character varying(50) NOT NULL,
    config_value character varying(255)
);

CREATE TABLE IF NOT EXISTS travelmate.beta_invites (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone,
    email character varying(255),
    expires_at timestamp(6) without time zone,
    invite_code character varying(64) NOT NULL,
    note character varying(500),
    status character varying(20) NOT NULL,
    used_at timestamp(6) without time zone,
    used_by_user_id bigint,
    CONSTRAINT beta_invites_status_check CHECK (((status)::text = ANY ((ARRAY['AVAILABLE'::character varying, 'USED'::character varying, 'EXPIRED'::character varying, 'REVOKED'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.bookmarks (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    folder_name character varying(100),
    note character varying(500),
    target_id bigint NOT NULL,
    target_type character varying(50) NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT bookmarks_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['POST'::character varying, 'LOCATION'::character varying, 'NFT'::character varying, 'USER'::character varying, 'GROUP'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.chat_messages (
    id BIGSERIAL NOT NULL,
    room_id bigint NOT NULL,
    sender_id bigint NOT NULL,
    content text NOT NULL,
    message_type character varying(255) DEFAULT 'TEXT'::character varying,
    file_url character varying(500),
    file_name character varying(200),
    file_size bigint,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    image_url character varying(255),
    location_latitude double precision,
    location_longitude double precision,
    location_name character varying(255),
    sent_at timestamp(6) without time zone,
    chat_room_id bigint
);

CREATE TABLE IF NOT EXISTS travelmate.chat_participants (
    id BIGSERIAL NOT NULL,
    is_active boolean,
    joined_at timestamp(6) without time zone,
    last_read_at timestamp(6) without time zone,
    last_read_message_id bigint,
    chat_room_id bigint,
    user_id bigint
);

CREATE TABLE IF NOT EXISTS travelmate.chat_rooms (
    id BIGSERIAL NOT NULL,
    group_id bigint,
    name character varying(200),
    type character varying(20) DEFAULT 'GROUP'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_message character varying(255),
    last_message_at timestamp(6) without time zone,
    room_name character varying(255),
    room_type character varying(255) NOT NULL,
    travel_group_id bigint,
    CONSTRAINT chat_rooms_room_type_check CHECK (((room_type)::text = ANY ((ARRAY['PRIVATE'::character varying, 'GROUP'::character varying, 'TRAVEL_GROUP'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.collectible_locations (
    id BIGSERIAL NOT NULL,
    average_rating double precision,
    category character varying(30) NOT NULL,
    city character varying(100),
    collect_radius double precision NOT NULL,
    country character varying(100),
    created_at timestamp(6) without time zone,
    description text,
    event_end_at timestamp(6) without time zone,
    event_start_at timestamp(6) without time zone,
    image_url character varying(500),
    is_active boolean NOT NULL,
    is_seasonal_event boolean NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    name character varying(200) NOT NULL,
    nft_image_url character varying(500),
    nft_metadata_uri character varying(500),
    point_reward integer,
    rarity character varying(20) NOT NULL,
    region character varying(100),
    review_count integer,
    total_collected integer,
    updated_at timestamp(6) without time zone,
    CONSTRAINT collectible_locations_category_check CHECK (((category)::text = ANY ((ARRAY['LANDMARK'::character varying, 'TOURIST_SPOT'::character varying, 'HIDDEN_GEM'::character varying, 'EVENT'::character varying, 'CULTURAL_HERITAGE'::character varying, 'NATURE'::character varying, 'CITY'::character varying])::text[]))),
    CONSTRAINT collectible_locations_rarity_check CHECK (((rarity)::text = ANY ((ARRAY['COMMON'::character varying, 'RARE'::character varying, 'EPIC'::character varying, 'LEGENDARY'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.collection_set_locations (
    set_id bigint NOT NULL,
    location_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.collection_sets (
    id BIGSERIAL NOT NULL,
    badge_url character varying(500),
    bonus_points integer NOT NULL,
    bonus_title character varying(100),
    created_at timestamp(6) without time zone,
    description text,
    end_at timestamp(6) without time zone,
    icon_url character varying(500),
    is_active boolean NOT NULL,
    is_limited_time boolean,
    name character varying(100) NOT NULL,
    region character varying(100),
    required_count integer NOT NULL,
    start_at timestamp(6) without time zone
);

CREATE TABLE IF NOT EXISTS travelmate.comment_likes (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone,
    comment_id bigint,
    user_id bigint
);

CREATE TABLE IF NOT EXISTS travelmate.comments (
    id BIGSERIAL NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone,
    is_deleted boolean,
    like_count integer,
    updated_at timestamp(6) without time zone,
    author_id bigint,
    parent_comment_id bigint,
    post_id bigint
);

CREATE TABLE IF NOT EXISTS travelmate.conversations (
    id BIGSERIAL NOT NULL,
    participant1_id bigint NOT NULL,
    participant2_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_message_at timestamp without time zone,
    CONSTRAINT chk_conversation_not_self CHECK ((participant1_id <> participant2_id))
);

CREATE TABLE IF NOT EXISTS travelmate.device_tokens (
    id BIGSERIAL NOT NULL,
    active boolean NOT NULL,
    app_version character varying(50),
    created_at timestamp(6) without time zone NOT NULL,
    device_model character varying(100),
    device_type character varying(255) NOT NULL,
    last_used_at timestamp(6) without time zone,
    os_version character varying(50),
    token character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT device_tokens_device_type_check CHECK (((device_type)::text = ANY ((ARRAY['ANDROID'::character varying, 'IOS'::character varying, 'WEB'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.email_verifications (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone,
    email character varying(100) NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    is_verified boolean NOT NULL,
    last_sent_at timestamp(6) without time zone,
    send_count integer NOT NULL,
    token character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    verification_code character varying(10),
    verified_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    CONSTRAINT email_verifications_type_check CHECK (((type)::text = ANY ((ARRAY['EMAIL_VERIFICATION'::character varying, 'PASSWORD_RESET'::character varying, 'EMAIL_CHANGE'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.emergency_contacts (
    id BIGSERIAL NOT NULL,
    user_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    relationship character varying(50) NOT NULL,
    phone_number character varying(20) NOT NULL,
    email character varying(255),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.group_members (
    id BIGSERIAL NOT NULL,
    group_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role character varying(20) DEFAULT 'MEMBER'::character varying,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    travel_group_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.itinerary_collaborators (
    id BIGSERIAL NOT NULL,
    itinerary_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role character varying(255) DEFAULT 'VIEWER'::character varying NOT NULL,
    status character varying(255) DEFAULT 'PENDING'::character varying NOT NULL,
    invited_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    accepted_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS travelmate.itinerary_comments (
    id BIGSERIAL NOT NULL,
    itinerary_id bigint NOT NULL,
    user_id bigint NOT NULL,
    content text NOT NULL,
    parent_id bigint,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS travelmate.itinerary_items (
    id BIGSERIAL NOT NULL,
    itinerary_id bigint NOT NULL,
    day_number integer NOT NULL,
    order_index integer NOT NULL,
    type character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    notes text,
    place_name character varying(255),
    place_address character varying(255),
    latitude double precision,
    longitude double precision,
    google_place_id character varying(255),
    start_time time without time zone,
    end_time time without time zone,
    duration_minutes integer,
    estimated_cost double precision,
    actual_cost double precision,
    currency character varying(255),
    booking_reference character varying(255),
    booking_url character varying(255),
    booking_status character varying(255),
    image_url character varying(255),
    location_collection_id bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS travelmate.itinerary_likes (
    id BIGSERIAL NOT NULL,
    user_id bigint NOT NULL,
    itinerary_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS travelmate.location_review_photos (
    review_id bigint NOT NULL,
    photo_url character varying(255)
);

CREATE TABLE IF NOT EXISTS travelmate.location_reviews (
    id BIGSERIAL NOT NULL,
    comment character varying(1000),
    created_at timestamp(6) without time zone NOT NULL,
    helpful_count integer NOT NULL,
    rating integer NOT NULL,
    updated_at timestamp(6) without time zone,
    visited_season character varying(20),
    location_id bigint NOT NULL,
    reviewer_id bigint NOT NULL,
    CONSTRAINT location_reviews_visited_season_check CHECK (((visited_season)::text = ANY ((ARRAY['SPRING'::character varying, 'SUMMER'::character varying, 'FALL'::character varying, 'WINTER'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.login_history (
    id BIGSERIAL NOT NULL,
    browser_name character varying(100),
    created_at timestamp(6) without time zone,
    device_type character varying(50),
    failure_reason character varying(255),
    ip_address character varying(45),
    latitude double precision,
    location_city character varying(100),
    location_country character varying(100),
    longitude double precision,
    os_name character varying(100),
    status character varying(20) NOT NULL,
    user_agent text,
    user_id bigint NOT NULL,
    CONSTRAINT login_history_status_check CHECK (((status)::text = ANY ((ARRAY['SUCCESS'::character varying, 'FAILED'::character varying, 'BLOCKED'::character varying, 'SUSPICIOUS'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.match_history (
    id BIGSERIAL NOT NULL,
    user_id bigint NOT NULL,
    matched_user_id bigint,
    matched_group_id bigint,
    match_type character varying(20) NOT NULL,
    match_score numeric(5,2),
    location_latitude double precision,
    location_longitude double precision,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT match_history_check CHECK ((((matched_user_id IS NOT NULL) AND (matched_group_id IS NULL)) OR ((matched_user_id IS NULL) AND (matched_group_id IS NOT NULL))))
);

CREATE TABLE IF NOT EXISTS travelmate.match_requests (
    id BIGSERIAL NOT NULL,
    requester_id bigint NOT NULL,
    receiver_id bigint NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    total_score numeric(5,2),
    travel_style_score numeric(5,2),
    schedule_overlap_score numeric(5,2),
    budget_score numeric(5,2),
    language_score numeric(5,2),
    rating_score numeric(5,2),
    message character varying(500),
    expires_at timestamp without time zone,
    responded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_not_self_match CHECK ((requester_id <> receiver_id))
);

CREATE TABLE IF NOT EXISTS travelmate.message_read_status (
    id BIGSERIAL NOT NULL,
    message_id bigint NOT NULL,
    user_id bigint NOT NULL,
    read_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS travelmate.messages (
    id BIGSERIAL NOT NULL,
    conversation_id bigint NOT NULL,
    sender_id bigint NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.nft_auctions (
    id BIGSERIAL NOT NULL,
    bid_count integer,
    buy_now_price bigint,
    created_at timestamp(6) without time zone,
    current_price bigint NOT NULL,
    end_at timestamp(6) without time zone NOT NULL,
    min_bid_increment bigint NOT NULL,
    settled_at timestamp(6) without time zone,
    start_at timestamp(6) without time zone NOT NULL,
    starting_price bigint NOT NULL,
    status character varying(20) NOT NULL,
    highest_bidder_id bigint,
    nft_collection_id bigint NOT NULL,
    seller_id bigint NOT NULL,
    CONSTRAINT nft_auctions_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'SOLD'::character varying, 'SETTLED'::character varying, 'CANCELLED'::character varying, 'NO_BIDS'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.nft_marketplace_listings (
    id BIGSERIAL NOT NULL,
    buy_transaction_hash character varying(100),
    created_at timestamp(6) without time zone,
    expires_at timestamp(6) without time zone,
    listed_at timestamp(6) without time zone NOT NULL,
    price_in_matic numeric(18,8),
    price_in_points bigint NOT NULL,
    sold_at timestamp(6) without time zone,
    status character varying(20) NOT NULL,
    buyer_id bigint,
    nft_collection_id bigint NOT NULL,
    seller_id bigint NOT NULL,
    CONSTRAINT nft_marketplace_listings_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'SOLD'::character varying, 'CANCELLED'::character varying, 'EXPIRED'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.nft_traits (
    id BIGSERIAL NOT NULL,
    display_name character varying(100),
    icon_url character varying(500),
    point_bonus integer,
    rarity_modifier double precision,
    trait_type character varying(50) NOT NULL,
    trait_value character varying(100) NOT NULL,
    nft_collection_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.notifications (
    id BIGSERIAL NOT NULL,
    user_id bigint NOT NULL,
    type character varying(255) NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    action_url character varying(255),
    message character varying(500) NOT NULL,
    read_at timestamp(6) without time zone,
    related_id bigint,
    related_type character varying(255),
    sent_via_push boolean
);

CREATE TABLE IF NOT EXISTS travelmate.payments (
    id BIGSERIAL NOT NULL,
    amount numeric(12,2) NOT NULL,
    cancelled_at timestamp(6) without time zone,
    coupon_code character varying(50),
    coupon_discount numeric(12,2),
    created_at timestamp(6) without time zone NOT NULL,
    currency character varying(3),
    discount_amount numeric(12,2),
    failure_reason character varying(255),
    final_amount numeric(12,2) NOT NULL,
    order_id character varying(64) NOT NULL,
    order_name character varying(255) NOT NULL,
    paid_at timestamp(6) without time zone,
    payment_key character varying(200),
    payment_method character varying(20),
    pg_provider character varying(20),
    product_id character varying(50),
    product_type character varying(20) NOT NULL,
    quantity integer,
    receipt_url character varying(500),
    refund_amount numeric(12,2),
    refund_reason character varying(255),
    refunded_at timestamp(6) without time zone,
    status character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    CONSTRAINT payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['CARD'::character varying, 'BANK_TRANSFER'::character varying, 'VIRTUAL_ACCOUNT'::character varying, 'KAKAO_PAY'::character varying, 'TOSS_PAY'::character varying, 'NAVER_PAY'::character varying])::text[]))),
    CONSTRAINT payments_product_type_check CHECK (((product_type)::text = ANY ((ARRAY['POINTS'::character varying, 'SUBSCRIPTION'::character varying, 'NFT'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'READY'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying, 'PARTIAL_CANCELLED'::character varying, 'REFUNDED'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.point_transactions (
    id BIGSERIAL NOT NULL,
    amount bigint NOT NULL,
    balance_after bigint NOT NULL,
    created_at timestamp(6) without time zone,
    description character varying(500),
    reference_id bigint,
    reference_type character varying(50),
    source character varying(30) NOT NULL,
    type character varying(20) NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT point_transactions_source_check CHECK (((source)::text = ANY ((ARRAY['NFT_COLLECT'::character varying, 'GROUP_ACTIVITY'::character varying, 'ACHIEVEMENT'::character varying, 'DAILY_LOGIN'::character varying, 'MARKETPLACE_PURCHASE'::character varying, 'MARKETPLACE_SALE'::character varying, 'TRANSFER'::character varying, 'EVENT_REWARD'::character varying, 'REFERRAL'::character varying, 'ADMIN'::character varying, 'PURCHASE'::character varying, 'REFUND'::character varying])::text[]))),
    CONSTRAINT point_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['EARN'::character varying, 'SPEND'::character varying, 'TRANSFER_IN'::character varying, 'TRANSFER_OUT'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.post_images (
    id BIGSERIAL NOT NULL,
    display_order integer,
    file_size bigint,
    image_url character varying(255) NOT NULL,
    original_filename character varying(255),
    uploaded_at timestamp(6) without time zone,
    post_id bigint
);

CREATE TABLE IF NOT EXISTS travelmate.post_likes (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone,
    post_id bigint,
    user_id bigint
);

CREATE TABLE IF NOT EXISTS travelmate.posts (
    id BIGSERIAL NOT NULL,
    category character varying(255) NOT NULL,
    comment_count integer,
    content text NOT NULL,
    created_at timestamp(6) without time zone,
    is_pinned boolean,
    like_count integer,
    location_latitude double precision,
    location_longitude double precision,
    location_name character varying(255),
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    view_count integer,
    author_id bigint,
    CONSTRAINT posts_category_check CHECK (((category)::text = ANY ((ARRAY['TRAVEL_TIP'::character varying, 'DESTINATION_INFO'::character varying, 'TRAVEL_REVIEW'::character varying, 'FOOD_RECOMMEND'::character varying, 'ACCOMMODATION'::character varying, 'TRANSPORTATION'::character varying, 'BUDGET_INFO'::character varying, 'TRAVEL_ROUTE'::character varying, 'SAFETY_INFO'::character varying, 'CULTURE_INFO'::character varying, 'SHOPPING'::character varying, 'ACTIVITY'::character varying, 'PHOTOGRAPHY'::character varying, 'QUESTION'::character varying, 'FREE_TALK'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.refresh_tokens (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone,
    device_id character varying(100),
    device_name character varying(200),
    expires_at timestamp(6) without time zone NOT NULL,
    ip_address character varying(45),
    is_revoked boolean NOT NULL,
    last_used_at timestamp(6) without time zone,
    token character varying(500) NOT NULL,
    user_agent text,
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.reports (
    id BIGSERIAL NOT NULL,
    reporter_id bigint NOT NULL,
    reported_user_id bigint,
    reported_group_id bigint,
    report_type character varying(255) NOT NULL,
    description character varying(2000),
    status character varying(255) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp with time zone,
    admin_note character varying(1000),
    processed_at timestamp(6) without time zone,
    reason character varying(500) NOT NULL,
    processed_by bigint,
    CONSTRAINT reports_check CHECK ((((reported_user_id IS NOT NULL) AND (reported_group_id IS NULL)) OR ((reported_user_id IS NULL) AND (reported_group_id IS NOT NULL))))
);

CREATE TABLE IF NOT EXISTS travelmate.review_helpfuls (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    review_id bigint NOT NULL,
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.subscriptions (
    id BIGSERIAL NOT NULL,
    auto_renew boolean,
    billing_amount numeric(12,2),
    billing_cycle character varying(20),
    cancel_reason character varying(255),
    cancelled_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    end_date timestamp(6) without time zone NOT NULL,
    next_billing_date timestamp(6) without time zone,
    payment_method_id character varying(100),
    start_date timestamp(6) without time zone NOT NULL,
    status character varying(20) NOT NULL,
    tier character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    CONSTRAINT subscriptions_billing_cycle_check CHECK (((billing_cycle)::text = ANY ((ARRAY['MONTHLY'::character varying, 'YEARLY'::character varying])::text[]))),
    CONSTRAINT subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'CANCELLED'::character varying, 'EXPIRED'::character varying, 'SUSPENDED'::character varying, 'PENDING'::character varying])::text[]))),
    CONSTRAINT subscriptions_tier_check CHECK (((tier)::text = ANY ((ARRAY['FREE'::character varying, 'BASIC'::character varying, 'PREMIUM'::character varying, 'PRO'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.travel_groups (
    id BIGSERIAL NOT NULL,
    creator_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    destination character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    max_members integer DEFAULT 10 NOT NULL,
    current_members integer DEFAULT 1,
    travel_style character varying(50),
    budget_range character varying(50),
    group_image_url character varying(500),
    meeting_location character varying(200),
    requirements text,
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    meeting_address character varying(200),
    meeting_latitude double precision,
    meeting_longitude double precision,
    purpose character varying(50),
    scheduled_time timestamp(6) without time zone,
    status character varying(50) NOT NULL,
    CONSTRAINT check_current_members CHECK ((current_members >= 0)),
    CONSTRAINT check_dates CHECK ((end_date >= start_date)),
    CONSTRAINT check_max_members CHECK ((max_members > 0)),
    CONSTRAINT travel_groups_purpose_check CHECK (((purpose)::text = ANY ((ARRAY['LEISURE'::character varying, 'BUSINESS'::character varying, 'EDUCATION'::character varying, 'MEDICAL'::character varying, 'FAMILY'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT travel_groups_status_check CHECK (((status)::text = ANY ((ARRAY['RECRUITING'::character varying, 'ACTIVE'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.travel_itineraries (
    id BIGSERIAL NOT NULL,
    user_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    cover_image character varying(255),
    visibility character varying(255) DEFAULT 'PRIVATE'::character varying NOT NULL,
    share_code character varying(255),
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    copy_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_travel_itinerary_dates CHECK ((end_date >= start_date))
);

CREATE TABLE IF NOT EXISTS travelmate.travel_reviews (
    id BIGSERIAL NOT NULL,
    comment character varying(500),
    communication_score integer NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    manners_score integer NOT NULL,
    punctuality_score integer NOT NULL,
    would_travel_again boolean NOT NULL,
    match_request_id bigint NOT NULL,
    reviewee_id bigint NOT NULL,
    reviewer_id bigint NOT NULL,
    CONSTRAINT travel_reviews_communication_score_check CHECK (((communication_score <= 5) AND (communication_score >= 1))),
    CONSTRAINT travel_reviews_manners_score_check CHECK (((manners_score <= 5) AND (manners_score >= 1))),
    CONSTRAINT travel_reviews_punctuality_score_check CHECK (((punctuality_score <= 5) AND (punctuality_score >= 1)))
);

CREATE TABLE IF NOT EXISTS travelmate.two_factor_auth (
    id BIGSERIAL NOT NULL,
    backup_codes text,
    created_at timestamp(6) without time zone,
    is_enabled boolean NOT NULL,
    last_used_at timestamp(6) without time zone,
    method character varying(20) NOT NULL,
    phone_number character varying(20),
    secret_key character varying(32) NOT NULL,
    updated_at timestamp(6) without time zone,
    verified_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    CONSTRAINT two_factor_auth_method_check CHECK (((method)::text = ANY ((ARRAY['TOTP'::character varying, 'SMS'::character varying, 'EMAIL'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.uploaded_files (
    id BIGSERIAL NOT NULL,
    content_type character varying(255),
    created_at timestamp(6) without time zone,
    file_size bigint,
    file_type character varying(255),
    file_url character varying(255) NOT NULL,
    original_filename character varying(255),
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.user_achievements (
    id BIGSERIAL NOT NULL,
    badge_token_id character varying(100),
    badge_transaction_hash character varying(100),
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone,
    current_progress integer NOT NULL,
    is_completed boolean NOT NULL,
    target_progress integer NOT NULL,
    achievement_id bigint NOT NULL,
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.user_blocks (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    reason character varying(500),
    blocked_id bigint NOT NULL,
    blocker_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.user_follows (
    id BIGSERIAL NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    follower_id bigint NOT NULL,
    following_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.user_group_memberships (
    id BIGSERIAL NOT NULL,
    joined_at timestamp(6) without time zone NOT NULL,
    left_at timestamp(6) without time zone,
    role character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    travel_group_id bigint NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT user_group_memberships_role_check CHECK (((role)::text = ANY ((ARRAY['LEADER'::character varying, 'MEMBER'::character varying])::text[]))),
    CONSTRAINT user_group_memberships_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'LEFT'::character varying, 'KICKED'::character varying, 'PENDING'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.user_interests (
    user_id bigint NOT NULL,
    interest character varying(255)
);

CREATE TABLE IF NOT EXISTS travelmate.user_languages (
    user_id bigint NOT NULL,
    language character varying(255)
);

CREATE TABLE IF NOT EXISTS travelmate.user_nft_collections (
    id BIGSERIAL NOT NULL,
    collected_at timestamp(6) without time zone NOT NULL,
    collected_latitude double precision NOT NULL,
    collected_longitude double precision NOT NULL,
    contract_address character varying(100),
    created_at timestamp(6) without time zone,
    device_id character varying(100),
    earned_points integer,
    gps_accuracy character varying(50),
    is_verified boolean NOT NULL,
    mint_status character varying(20) NOT NULL,
    token_id character varying(100),
    transaction_hash character varying(100),
    verification_method character varying(50),
    wallet_address character varying(100),
    location_id bigint NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT user_nft_collections_mint_status_check CHECK (((mint_status)::text = ANY ((ARRAY['PENDING'::character varying, 'MINTING'::character varying, 'CONFIRMING'::character varying, 'MINTED'::character varying, 'FAILED'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.user_points (
    id BIGSERIAL NOT NULL,
    current_rank integer,
    lifetime_earned bigint NOT NULL,
    lifetime_spent bigint NOT NULL,
    season_points bigint NOT NULL,
    total_points bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.user_reviews (
    id BIGSERIAL NOT NULL,
    reviewer_id bigint NOT NULL,
    reviewed_user_id bigint NOT NULL,
    group_id bigint,
    rating integer NOT NULL,
    comment character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    review_type character varying(255),
    reviewee_id bigint,
    travel_group_id bigint,
    CONSTRAINT user_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT user_reviews_review_type_check CHECK (((review_type)::text = ANY ((ARRAY['POSITIVE'::character varying, 'NEUTRAL'::character varying, 'NEGATIVE'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS travelmate.user_trust_scores (
    id BIGSERIAL NOT NULL,
    user_id bigint NOT NULL,
    base_score integer DEFAULT 50 NOT NULL,
    review_score integer DEFAULT 0 NOT NULL,
    activity_score integer DEFAULT 0 NOT NULL,
    total_score integer DEFAULT 50 NOT NULL,
    trust_badge character varying(20) DEFAULT 'NEW'::character varying NOT NULL,
    last_calculated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS travelmate.users (
    id BIGSERIAL NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    nickname character varying(50) NOT NULL,
    age integer,
    gender character varying(10),
    bio text,
    profile_image_url character varying(500),
    travel_style character varying(50),
    interests text[],
    languages text[],
    location_latitude double precision,
    location_longitude double precision,
    fcm_token character varying(255),
    is_active boolean DEFAULT true,
    is_email_verified boolean DEFAULT false,
    is_location_enabled boolean DEFAULT false,
    rating double precision DEFAULT 0.0,
    review_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    budget_preference character varying(20) DEFAULT 'MEDIUM'::character varying,
    current_latitude double precision,
    current_longitude double precision,
    deletion_requested_at timestamp(6) without time zone,
    email_notification_enabled boolean NOT NULL,
    full_name character varying(100),
    global_rank integer,
    is_matching_enabled boolean NOT NULL,
    is_wallet_verified boolean NOT NULL,
    last_activity_at timestamp(6) without time zone,
    locked_until timestamp(6) without time zone,
    login_attempts integer NOT NULL,
    password_changed_at timestamp(6) without time zone,
    phone_number character varying(20),
    phone_verified boolean NOT NULL,
    polygon_wallet_address character varying(100),
    privacy_location_visible boolean NOT NULL,
    privacy_profile_visible boolean NOT NULL,
    provider character varying(20),
    provider_id character varying(100),
    push_notification_enabled boolean NOT NULL,
    region_rank integer,
    role character varying(255) NOT NULL,
    total_nfts_collected integer NOT NULL,
    unique_locations_visited integer NOT NULL,
    CONSTRAINT users_provider_check CHECK (((provider)::text = ANY ((ARRAY['LOCAL'::character varying, 'GOOGLE'::character varying, 'KAKAO'::character varying, 'NAVER'::character varying, 'FACEBOOK'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ADMIN'::character varying, 'MODERATOR'::character varying])::text[])))
);


-- Add columns that are absent from the legacy V1-V7 migration path.
ALTER TABLE travelmate.users ALTER COLUMN rating TYPE double precision USING rating::double precision;
ALTER TABLE travelmate.chat_messages ADD COLUMN IF NOT EXISTS image_url character varying(255);
ALTER TABLE travelmate.chat_messages ADD COLUMN IF NOT EXISTS location_latitude double precision;
ALTER TABLE travelmate.chat_messages ADD COLUMN IF NOT EXISTS location_longitude double precision;
ALTER TABLE travelmate.chat_messages ADD COLUMN IF NOT EXISTS location_name character varying(255);
ALTER TABLE travelmate.chat_messages ADD COLUMN IF NOT EXISTS sent_at timestamp(6) without time zone;
ALTER TABLE travelmate.chat_messages ADD COLUMN IF NOT EXISTS chat_room_id bigint;
ALTER TABLE travelmate.chat_rooms ADD COLUMN IF NOT EXISTS last_message character varying(255);
ALTER TABLE travelmate.chat_rooms ADD COLUMN IF NOT EXISTS last_message_at timestamp(6) without time zone;
ALTER TABLE travelmate.chat_rooms ADD COLUMN IF NOT EXISTS room_name character varying(255);
ALTER TABLE travelmate.chat_rooms ADD COLUMN IF NOT EXISTS room_type character varying(255);
ALTER TABLE travelmate.chat_rooms ADD COLUMN IF NOT EXISTS travel_group_id bigint;
ALTER TABLE travelmate.group_members ADD COLUMN IF NOT EXISTS travel_group_id bigint;
ALTER TABLE travelmate.notifications ADD COLUMN IF NOT EXISTS action_url character varying(255);
ALTER TABLE travelmate.notifications ADD COLUMN IF NOT EXISTS message character varying(500);
ALTER TABLE travelmate.notifications ADD COLUMN IF NOT EXISTS read_at timestamp(6) without time zone;
ALTER TABLE travelmate.notifications ADD COLUMN IF NOT EXISTS related_id bigint;
ALTER TABLE travelmate.notifications ADD COLUMN IF NOT EXISTS related_type character varying(255);
ALTER TABLE travelmate.notifications ADD COLUMN IF NOT EXISTS sent_via_push boolean;
ALTER TABLE travelmate.reports ADD COLUMN IF NOT EXISTS admin_note character varying(1000);
ALTER TABLE travelmate.reports ADD COLUMN IF NOT EXISTS processed_at timestamp(6) without time zone;
ALTER TABLE travelmate.reports ADD COLUMN IF NOT EXISTS reason character varying(500);
ALTER TABLE travelmate.reports ADD COLUMN IF NOT EXISTS processed_by bigint;
ALTER TABLE travelmate.travel_groups ADD COLUMN IF NOT EXISTS meeting_address character varying(200);
ALTER TABLE travelmate.travel_groups ADD COLUMN IF NOT EXISTS meeting_latitude double precision;
ALTER TABLE travelmate.travel_groups ADD COLUMN IF NOT EXISTS meeting_longitude double precision;
ALTER TABLE travelmate.travel_groups ADD COLUMN IF NOT EXISTS purpose character varying(50);
ALTER TABLE travelmate.travel_groups ADD COLUMN IF NOT EXISTS scheduled_time timestamp(6) without time zone;
ALTER TABLE travelmate.travel_groups ADD COLUMN IF NOT EXISTS status character varying(50);
ALTER TABLE travelmate.user_reviews ADD COLUMN IF NOT EXISTS review_type character varying(255);
ALTER TABLE travelmate.user_reviews ADD COLUMN IF NOT EXISTS reviewee_id bigint;
ALTER TABLE travelmate.user_reviews ADD COLUMN IF NOT EXISTS travel_group_id bigint;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS current_latitude double precision;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS current_longitude double precision;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS deletion_requested_at timestamp(6) without time zone;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS email_notification_enabled boolean;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS full_name character varying(100);
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS global_rank integer;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS is_matching_enabled boolean;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS is_wallet_verified boolean;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS last_activity_at timestamp(6) without time zone;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS locked_until timestamp(6) without time zone;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS login_attempts integer;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS password_changed_at timestamp(6) without time zone;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS phone_number character varying(20);
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS phone_verified boolean;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS polygon_wallet_address character varying(100);
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS privacy_location_visible boolean;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS privacy_profile_visible boolean;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS provider character varying(20);
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS provider_id character varying(100);
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS push_notification_enabled boolean;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS region_rank integer;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS role character varying(255);
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS total_nfts_collected integer;
ALTER TABLE travelmate.users ADD COLUMN IF NOT EXISTS unique_locations_visited integer;
