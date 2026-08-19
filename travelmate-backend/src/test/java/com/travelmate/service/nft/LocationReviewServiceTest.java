package com.travelmate.service.nft;

import com.travelmate.dto.nft.LocationReviewDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.LocationReview;
import com.travelmate.entity.nft.ReviewHelpful;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.LocationReviewRepository;
import com.travelmate.repository.nft.ReviewHelpfulRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LocationReviewService 테스트")
class LocationReviewServiceTest {

    @Mock
    private LocationReviewRepository locationReviewRepository;

    @Mock
    private ReviewHelpfulRepository reviewHelpfulRepository;

    @Mock
    private CollectibleLocationRepository locationRepository;

    @Mock
    private UserNftCollectionRepository userNftCollectionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LocationReviewService locationReviewService;

    private User reviewer;
    private User otherUser;
    private CollectibleLocation location;
    private LocationReview review;

    @BeforeEach
    void setUp() {
        reviewer = new User();
        reviewer.setId(1L);
        reviewer.setNickname("리뷰어");
        reviewer.setEmail("reviewer@test.com");
        reviewer.setPassword("password");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setNickname("다른사용자");
        otherUser.setEmail("other@test.com");
        otherUser.setPassword("password");

        location = CollectibleLocation.builder()
                .id(1L)
                .name("테스트 장소")
                .description("테스트 장소 설명")
                .averageRating(0.0)
                .reviewCount(0)
                .build();

        review = LocationReview.builder()
                .id(1L)
                .reviewer(reviewer)
                .location(location)
                .rating(5)
                .comment("좋은 장소입니다")
                .helpfulCount(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("리뷰 작성 테스트")
    class CreateReviewTest {

        @Test
        @DisplayName("성공 - 리뷰 작성")
        void createReview_Success() {
            // Given
            LocationReviewDto.CreateRequest request = new LocationReviewDto.CreateRequest();
            request.setRating(5);
            request.setComment("좋은 장소입니다");

            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(locationRepository.findById(1L)).thenReturn(Optional.of(location));
            when(userNftCollectionRepository.existsByUserIdAndLocationId(1L, 1L)).thenReturn(true);
            when(locationReviewRepository.existsByReviewerIdAndLocationId(1L, 1L)).thenReturn(false);
            when(locationReviewRepository.save(any(LocationReview.class))).thenReturn(review);
            when(locationReviewRepository.getAverageRatingByLocationId(1L)).thenReturn(5.0);
            when(locationReviewRepository.countByLocationId(1L)).thenReturn(1L);
            when(reviewHelpfulRepository.existsByUserIdAndReviewId(anyLong(), anyLong())).thenReturn(false);

            // When
            LocationReviewDto.Response result = locationReviewService.createReview(1L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getRating()).isEqualTo(5);
            assertThat(result.getComment()).isEqualTo("좋은 장소입니다");
            verify(locationReviewRepository).save(any(LocationReview.class));
            verify(locationRepository).save(any(CollectibleLocation.class));
        }

        @Test
        @DisplayName("실패 - 수집하지 않은 장소")
        void createReview_Fail_NotCollected() {
            // Given
            LocationReviewDto.CreateRequest request = new LocationReviewDto.CreateRequest();
            request.setRating(5);
            request.setComment("좋은 장소입니다");

            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(locationRepository.findById(1L)).thenReturn(Optional.of(location));
            when(userNftCollectionRepository.existsByUserIdAndLocationId(1L, 1L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> locationReviewService.createReview(1L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("수집한 후에 리뷰를 작성")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 중복 리뷰")
        void createReview_Fail_DuplicateReview() {
            // Given
            LocationReviewDto.CreateRequest request = new LocationReviewDto.CreateRequest();
            request.setRating(5);
            request.setComment("좋은 장소입니다");

            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(locationRepository.findById(1L)).thenReturn(Optional.of(location));
            when(userNftCollectionRepository.existsByUserIdAndLocationId(1L, 1L)).thenReturn(true);
            when(locationReviewRepository.existsByReviewerIdAndLocationId(1L, 1L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> locationReviewService.createReview(1L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 리뷰를 작성한 장소")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void createReview_Fail_UserNotFound() {
            // Given
            LocationReviewDto.CreateRequest request = new LocationReviewDto.CreateRequest();
            request.setRating(5);

            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> locationReviewService.createReview(1L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }

        @Test
        @DisplayName("실패 - 장소 없음")
        void createReview_Fail_LocationNotFound() {
            // Given
            LocationReviewDto.CreateRequest request = new LocationReviewDto.CreateRequest();
            request.setRating(5);

            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(locationRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> locationReviewService.createReview(1L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("장소를 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("리뷰 수정 테스트")
    class UpdateReviewTest {

        @Test
        @DisplayName("성공 - 리뷰 수정")
        void updateReview_Success() {
            // Given
            LocationReviewDto.UpdateRequest request = new LocationReviewDto.UpdateRequest();
            request.setRating(4);
            request.setComment("수정된 리뷰");

            when(locationReviewRepository.findById(1L)).thenReturn(Optional.of(review));
            when(locationReviewRepository.save(any(LocationReview.class))).thenReturn(review);
            when(locationReviewRepository.getAverageRatingByLocationId(anyLong())).thenReturn(4.0);
            when(locationReviewRepository.countByLocationId(anyLong())).thenReturn(1L);
            when(locationRepository.findById(anyLong())).thenReturn(Optional.of(location));
            when(reviewHelpfulRepository.existsByUserIdAndReviewId(anyLong(), anyLong())).thenReturn(false);

            // When
            LocationReviewDto.Response result = locationReviewService.updateReview(1L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(locationReviewRepository).save(any(LocationReview.class));
        }

        @Test
        @DisplayName("실패 - 작성자가 아님")
        void updateReview_Fail_NotOwner() {
            // Given
            LocationReviewDto.UpdateRequest request = new LocationReviewDto.UpdateRequest();
            request.setRating(4);

            when(locationReviewRepository.findById(1L)).thenReturn(Optional.of(review));

            // When & Then
            assertThatThrownBy(() -> locationReviewService.updateReview(2L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("본인이 작성한 리뷰만 수정")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }

        @Test
        @DisplayName("실패 - 리뷰 없음")
        void updateReview_Fail_ReviewNotFound() {
            // Given
            LocationReviewDto.UpdateRequest request = new LocationReviewDto.UpdateRequest();
            request.setRating(4);

            when(locationReviewRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> locationReviewService.updateReview(1L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("리뷰를 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("리뷰 삭제 테스트")
    class DeleteReviewTest {

        @Test
        @DisplayName("성공 - 리뷰 삭제")
        void deleteReview_Success() {
            // Given
            when(locationReviewRepository.findById(1L)).thenReturn(Optional.of(review));
            doNothing().when(locationReviewRepository).delete(any(LocationReview.class));
            when(locationReviewRepository.getAverageRatingByLocationId(anyLong())).thenReturn(null);
            when(locationReviewRepository.countByLocationId(anyLong())).thenReturn(0L);
            when(locationRepository.findById(anyLong())).thenReturn(Optional.of(location));

            // When
            locationReviewService.deleteReview(1L, 1L);

            // Then
            verify(locationReviewRepository).delete(any(LocationReview.class));
            verify(locationRepository).save(any(CollectibleLocation.class));
        }

        @Test
        @DisplayName("실패 - 작성자가 아님")
        void deleteReview_Fail_NotOwner() {
            // Given
            when(locationReviewRepository.findById(1L)).thenReturn(Optional.of(review));

            // When & Then
            assertThatThrownBy(() -> locationReviewService.deleteReview(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("본인이 작성한 리뷰만 삭제")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }
    }

    @Nested
    @DisplayName("리뷰 목록 조회 테스트")
    class GetReviewsTest {

        @Test
        @DisplayName("성공 - 최신순 정렬")
        void getLocationReviews_SortByRecent() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<LocationReview> reviewPage = new PageImpl<>(List.of(review), pageable, 1);

            when(locationReviewRepository.findByLocationIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(reviewPage);
            when(reviewHelpfulRepository.existsByUserIdAndReviewId(anyLong(), anyLong())).thenReturn(false);

            // When
            Page<LocationReviewDto.Response> result = locationReviewService.getLocationReviews(1L, 1L, "recent", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(locationReviewRepository).findByLocationIdOrderByCreatedAtDesc(1L, pageable);
        }

        @Test
        @DisplayName("성공 - 도움순 정렬")
        void getLocationReviews_SortByHelpful() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<LocationReview> reviewPage = new PageImpl<>(List.of(review), pageable, 1);

            when(locationReviewRepository.findByLocationIdOrderByHelpfulCountDesc(1L, pageable)).thenReturn(reviewPage);
            when(reviewHelpfulRepository.existsByUserIdAndReviewId(anyLong(), anyLong())).thenReturn(false);

            // When
            Page<LocationReviewDto.Response> result = locationReviewService.getLocationReviews(1L, 1L, "helpful", pageable);

            // Then
            assertThat(result).isNotNull();
            verify(locationReviewRepository).findByLocationIdOrderByHelpfulCountDesc(1L, pageable);
        }
    }

    @Nested
    @DisplayName("도움됨 토글 테스트")
    class ToggleHelpfulTest {

        @Test
        @DisplayName("성공 - 도움됨 추가")
        void toggleHelpful_Add() {
            // Given
            when(locationReviewRepository.findById(1L)).thenReturn(Optional.of(review));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(reviewHelpfulRepository.findByUserIdAndReviewId(2L, 1L)).thenReturn(Optional.empty());

            // When
            boolean result = locationReviewService.toggleHelpful(2L, 1L);

            // Then
            assertThat(result).isTrue();
            verify(reviewHelpfulRepository).save(any(ReviewHelpful.class));
            verify(locationReviewRepository).save(any(LocationReview.class));
        }

        @Test
        @DisplayName("성공 - 도움됨 취소")
        void toggleHelpful_Remove() {
            // Given
            ReviewHelpful helpful = ReviewHelpful.builder()
                    .id(1L)
                    .user(otherUser)
                    .review(review)
                    .build();

            when(locationReviewRepository.findById(1L)).thenReturn(Optional.of(review));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(reviewHelpfulRepository.findByUserIdAndReviewId(2L, 1L)).thenReturn(Optional.of(helpful));

            // When
            boolean result = locationReviewService.toggleHelpful(2L, 1L);

            // Then
            assertThat(result).isFalse();
            verify(reviewHelpfulRepository).delete(any(ReviewHelpful.class));
        }

        @Test
        @DisplayName("실패 - 본인 리뷰")
        void toggleHelpful_Fail_OwnReview() {
            // Given
            when(locationReviewRepository.findById(1L)).thenReturn(Optional.of(review));
            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));

            // When & Then
            assertThatThrownBy(() -> locationReviewService.toggleHelpful(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("본인의 리뷰에는 도움됨을 표시할 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }
    }

    @Nested
    @DisplayName("리뷰 통계 조회 테스트")
    class GetStatsTest {

        @Test
        @DisplayName("성공 - 통계 조회")
        void getLocationReviewStats_Success() {
            // Given
            when(locationReviewRepository.getAverageRatingByLocationId(1L)).thenReturn(4.5);
            when(locationReviewRepository.countByLocationId(1L)).thenReturn(10L);

            // When
            LocationReviewDto.LocationReviewStats result = locationReviewService.getLocationReviewStats(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getLocationId()).isEqualTo(1L);
            assertThat(result.getAverageRating()).isEqualTo(4.5);
            assertThat(result.getReviewCount()).isEqualTo(10L);
        }

        @Test
        @DisplayName("성공 - 리뷰 없는 장소")
        void getLocationReviewStats_NoReviews() {
            // Given
            when(locationReviewRepository.getAverageRatingByLocationId(1L)).thenReturn(null);
            when(locationReviewRepository.countByLocationId(1L)).thenReturn(0L);

            // When
            LocationReviewDto.LocationReviewStats result = locationReviewService.getLocationReviewStats(1L);

            // Then
            assertThat(result.getAverageRating()).isEqualTo(0.0);
            assertThat(result.getReviewCount()).isZero();
        }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
