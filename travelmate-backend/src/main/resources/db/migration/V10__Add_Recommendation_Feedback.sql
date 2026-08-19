CREATE TABLE IF NOT EXISTS travelmate.recommendation_feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id bigint NOT NULL,
    rating integer NOT NULL,
    comment character varying(1000),
    feedback_type character varying(50),
    target_type character varying(50),
    target_id bigint,
    metadata text,
    created_at timestamp(6) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recommendation_feedback_user
        FOREIGN KEY (user_id) REFERENCES travelmate.users(id) ON DELETE CASCADE,
    CONSTRAINT chk_recommendation_feedback_rating
        CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_created
    ON travelmate.recommendation_feedback (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_target
    ON travelmate.recommendation_feedback (target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_rating
    ON travelmate.recommendation_feedback (rating);
