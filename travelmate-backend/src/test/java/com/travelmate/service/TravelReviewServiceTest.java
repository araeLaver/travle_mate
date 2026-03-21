package com.travelmate.service;

import com.travelmate.dto.TravelReviewDto;
import com.travelmate.entity.MatchRequest;
import com.travelmate.entity.MatchRequest.MatchStatus;
import com.travelmate.entity.TravelReview;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.MatchRequestRepository;
import com.travelmate.repository.TravelReviewRepository;
import com.travelmate.repository.UserRepository;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TravelReviewService 테스트")
class TravelReviewServiceTest {

    @Mock private TravelReviewRepository travelReviewRepository;
    @Mock private UserRepository userRepository;
    @Mock private MatchRequestRepository matchRequestRepository;

    @InjectMocks private TravelReviewService travelReviewService;

    private User reviewer;
    private User reviewee;
    private MatchRequest matchRequest;

    @BeforeEach
    void setUp() {
        reviewer = new User();
        reviewer.setNickname("Alice");
        setId(reviewer, 1L);

        reviewee = new User();
        reviewee.setNickname("Bob");
        setId(reviewee, 2L);

        matchRequest = MatchRequest.builder()
                .requester(reviewer)
                .receiver(reviewee)
                .status(MatchStatus.MATCHED)
                .build();
        setMatchId(matchRequest, 100L);
    }

    private TravelReviewDto.CreateReviewRequest createRequest() {
        TravelReviewDto.CreateReviewRequest req = new TravelReviewDto.CreateReviewRequest();
        req.setRevieweeId(2L);
        req.setMatchRequestId(100L);
        req.setPunctualityScore(4);
        req.setMannersScore(5);
        req.setCommunicationScore(4);
        req.setWouldTravelAgain(true);
        req.setComment("좋은 동행이었습니다.");
        return req;
    }

    @Nested
    @DisplayName("createReview")
    class CreateReview {

        @Test
        @DisplayName("정상 리뷰 작성")
        void success() {
            var req = createRequest();
            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(matchRequestRepository.findById(100L)).thenReturn(Optional.of(matchRequest));
            when(travelReviewRepository.existsByReviewerIdAndMatchRequestId(1L, 100L)).thenReturn(false);
            when(travelReviewRepository.save(any())).thenAnswer(i -> {
                TravelReview r = i.getArgument(0);
                setReviewId(r, 1L);
                return r;
            });
            when(travelReviewRepository.getAverageScoreByRevieweeId(2L)).thenReturn(4.33);
            when(travelReviewRepository.getReviewCountByRevieweeId(2L)).thenReturn(1);
            when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = travelReviewService.createReview(1L, req);

            assertThat(result).isNotNull();
            assertThat(result.getPunctualityScore()).isEqualTo(4);
            assertThat(result.getMannersScore()).isEqualTo(5);
            verify(travelReviewRepository).save(any());
            verify(userRepository).save(reviewee); // rating 업데이트
        }

        @Test
        @DisplayName("자기 평가 방지")
        void failSelfReview() {
            var req = createRequest();
            req.setRevieweeId(1L);

            assertThatThrownBy(() -> travelReviewService.createReview(1L, req))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("MATCHED가 아닌 매칭에 대해 실패")
        void failNotMatched() {
            matchRequest = MatchRequest.builder()
                    .requester(reviewer).receiver(reviewee).status(MatchStatus.PENDING).build();
            setMatchId(matchRequest, 100L);
            var req = createRequest();
            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(matchRequestRepository.findById(100L)).thenReturn(Optional.of(matchRequest));

            assertThatThrownBy(() -> travelReviewService.createReview(1L, req))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("MATCHED");
        }

        @Test
        @DisplayName("매칭 참여자가 아니면 실패")
        void failNotParticipant() {
            User outsider = new User();
            setId(outsider, 99L);
            var req = createRequest();
            when(userRepository.findById(99L)).thenReturn(Optional.of(outsider));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(matchRequestRepository.findById(100L)).thenReturn(Optional.of(matchRequest));

            assertThatThrownBy(() -> travelReviewService.createReview(99L, req))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("참여자");
        }

        @Test
        @DisplayName("매칭 상대가 아닌 사람에 대한 리뷰 실패")
        void failNotOpponent() {
            User thirdParty = new User();
            setId(thirdParty, 3L);
            var req = createRequest();
            req.setRevieweeId(3L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(userRepository.findById(3L)).thenReturn(Optional.of(thirdParty));
            when(matchRequestRepository.findById(100L)).thenReturn(Optional.of(matchRequest));

            assertThatThrownBy(() -> travelReviewService.createReview(1L, req))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("중복 리뷰 방지")
        void failDuplicate() {
            var req = createRequest();
            when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(matchRequestRepository.findById(100L)).thenReturn(Optional.of(matchRequest));
            when(travelReviewRepository.existsByReviewerIdAndMatchRequestId(1L, 100L)).thenReturn(true);

            assertThatThrownBy(() -> travelReviewService.createReview(1L, req))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("getReviewsForUser")
    class GetReviewsForUser {

        @Test
        @DisplayName("리뷰 목록 조회")
        void success() {
            TravelReview review = TravelReview.builder()
                    .reviewer(reviewer).reviewee(reviewee)
                    .punctualityScore(4).mannersScore(5).communicationScore(4)
                    .wouldTravelAgain(true).build();
            setReviewId(review, 1L);
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewee));
            when(travelReviewRepository.findByRevieweeIdWithReviewer(2L)).thenReturn(List.of(review));

            var result = travelReviewService.getReviewsForUser(2L);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("존재하지 않는 사용자 조회 실패")
        void failNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> travelReviewService.getReviewsForUser(999L))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("getReviewsForMatch")
    class GetReviewsForMatch {

        @Test
        @DisplayName("매칭 리뷰 조회")
        void success() {
            when(matchRequestRepository.findById(100L)).thenReturn(Optional.of(matchRequest));
            when(travelReviewRepository.findByMatchRequestIdWithUsers(100L)).thenReturn(List.of());

            var result = travelReviewService.getReviewsForMatch(100L);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("존재하지 않는 매칭 조회 실패")
        void failNotFound() {
            when(matchRequestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> travelReviewService.getReviewsForMatch(999L))
                    .isInstanceOf(BusinessException.class);
        }
    }

    // --- Reflection helpers ---
    private void setId(User user, Long id) {
        try { var f = User.class.getDeclaredField("id"); f.setAccessible(true); f.set(user, id); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
    private void setMatchId(MatchRequest mr, Long id) {
        try { var f = MatchRequest.class.getDeclaredField("id"); f.setAccessible(true); f.set(mr, id); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
    private void setReviewId(TravelReview r, Long id) {
        try { var f = TravelReview.class.getDeclaredField("id"); f.setAccessible(true); f.set(r, id); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
}
