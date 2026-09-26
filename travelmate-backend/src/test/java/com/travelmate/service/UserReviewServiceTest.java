package com.travelmate.service;

import com.travelmate.dto.UserReviewDto;
import com.travelmate.entity.TravelGroup;
import com.travelmate.entity.User;
import com.travelmate.entity.UserReview;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.UserReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserReviewService 테스트")
class UserReviewServiceTest {

    @Mock private UserReviewRepository userReviewRepository;
    @Mock private UserRepository userRepository;
    @Mock private TravelGroupRepository travelGroupRepository;

    @InjectMocks private UserReviewService userReviewService;

    private User reviewer;
    private User reviewee;
    private TravelGroup travelGroup;

    @BeforeEach
    void setUp() {
        reviewer = new User();
        reviewer.setId(1L);
        reviewer.setNickname("Alice");

        reviewee = new User();
        reviewee.setId(2L);
        reviewee.setNickname("Bob");

        travelGroup = new TravelGroup();
        travelGroup.setId(100L);
        travelGroup.setTitle("Tokyo Trip");
        travelGroup.setDestination("Tokyo");
        travelGroup.setCreator(reviewer);
    }

    @Nested
    @DisplayName("createReview")
    class CreateReview {

        @Test
        @DisplayName("정상 사용자 평가 작성")
        void success() {
            UserReviewDto.CreateRequest request = createRequest();
            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(travelGroupRepository.findById(100L)).thenReturn(Optional.of(travelGroup));
            when(userReviewRepository.existsByReviewerIdAndRevieweeId(1L, 2L)).thenReturn(false);
            when(userReviewRepository.save(any(UserReview.class))).thenAnswer(invocation -> {
                UserReview review = invocation.getArgument(0);
                review.setId(10L);
                return review;
            });

            UserReviewDto.Response result = userReviewService.createReview(1L, 2L, request);

            assertThat(result.getId()).isEqualTo(10L);
            assertThat(result.getReviewer().getId()).isEqualTo(1L);
            assertThat(result.getReviewee().getId()).isEqualTo(2L);
            assertThat(result.getTravelGroupId()).isEqualTo(100L);
        }

        @Test
        @DisplayName("본인 평가는 400")
        void failSelfReview() {
            UserReviewDto.CreateRequest request = createRequest();

            assertThatThrownBy(() -> userReviewService.createReview(1L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("본인")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("평가자 없음은 404")
        void failReviewerNotFound() {
            UserReviewDto.CreateRequest request = createRequest();
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userReviewService.createReview(1L, 2L, request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }

        @Test
        @DisplayName("여행 그룹 없음은 404")
        void failGroupNotFound() {
            UserReviewDto.CreateRequest request = createRequest();
            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(travelGroupRepository.findById(100L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userReviewService.createReview(1L, 2L, request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "GROUP_NOT_FOUND"));
        }

        @Test
        @DisplayName("중복 평가는 409")
        void failDuplicateReview() {
            UserReviewDto.CreateRequest request = createRequest();
            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(travelGroupRepository.findById(100L)).thenReturn(Optional.of(travelGroup));
            when(userReviewRepository.existsByReviewerIdAndRevieweeId(1L, 2L)).thenReturn(true);

            assertThatThrownBy(() -> userReviewService.createReview(1L, 2L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }
    }

    @Nested
    @DisplayName("조회와 삭제")
    class ReadAndDelete {

        @Test
        @DisplayName("받은 평가 목록 조회 전 사용자 존재를 확인한다")
        void getReviewsForUser() {
            UserReview review = new UserReview(
                    10L, reviewer, reviewee, travelGroup, 5, "좋았습니다.",
                    UserReview.ReviewType.POSITIVE, null
            );
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(userReviewRepository.findByRevieweeIdWithReviewer(2L)).thenReturn(List.of(review));

            List<UserReviewDto.Response> result = userReviewService.getReviewsForUser(2L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getReviewer().getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("평가 통계 대상 사용자 없음은 404")
        void getReviewStatsUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userReviewService.getReviewStats(999L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }

        @Test
        @DisplayName("없는 평가 삭제는 404")
        void deleteReviewNotFound() {
            when(userReviewRepository.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userReviewService.deleteReview(1L, 10L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }

        @Test
        @DisplayName("다른 사용자의 평가 삭제는 403")
        void deleteReviewForbidden() {
            UserReview review = new UserReview(
                    10L, reviewer, reviewee, travelGroup, 5, "좋았습니다.",
                    UserReview.ReviewType.POSITIVE, null
            );
            when(userReviewRepository.findById(10L)).thenReturn(Optional.of(review));

            assertThatThrownBy(() -> userReviewService.deleteReview(2L, 10L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }
    }

    private UserReviewDto.CreateRequest createRequest() {
        UserReviewDto.CreateRequest request = new UserReviewDto.CreateRequest();
        request.setRating(5);
        request.setComment("좋았습니다.");
        request.setReviewType(UserReview.ReviewType.POSITIVE);
        request.setTravelGroupId(100L);
        return request;
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
