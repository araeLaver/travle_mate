package com.travelmate.repository.nft;

import com.travelmate.entity.nft.ReviewHelpful;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewHelpfulRepository extends JpaRepository<ReviewHelpful, Long> {

    // 특정 사용자가 특정 리뷰에 도움됨 표시했는지 확인
    boolean existsByUserIdAndReviewId(Long userId, Long reviewId);

    // 특정 사용자의 특정 리뷰 도움됨 조회
    Optional<ReviewHelpful> findByUserIdAndReviewId(Long userId, Long reviewId);

    // 특정 리뷰의 도움됨 수
    long countByReviewId(Long reviewId);
}
