package com.travelmate.service;

import com.travelmate.dto.FollowDto;
import com.travelmate.entity.User;
import com.travelmate.entity.UserFollow;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserFollowRepository;
import com.travelmate.repository.UserRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FollowService 테스트")
class FollowServiceTest {

    @Mock
    private UserFollowRepository userFollowRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FollowService followService;

    private User follower;
    private User following;

    @BeforeEach
    void setUp() {
        follower = new User();
        follower.setId(1L);
        follower.setNickname("팔로워");
        follower.setEmail("follower@test.com");
        follower.setPassword("password");

        following = new User();
        following.setId(2L);
        following.setNickname("팔로잉");
        following.setEmail("following@test.com");
        following.setPassword("password");
    }

    @Nested
    @DisplayName("팔로우 테스트")
    class FollowTest {

        @Test
        @DisplayName("성공 - 정상 팔로우")
        void follow_Success() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(follower));
            when(userRepository.findById(2L)).thenReturn(Optional.of(following));
            when(userFollowRepository.existsByFollowerIdAndFollowingId(2L, 1L)).thenReturn(false);
            when(userFollowRepository.countByFollowingId(2L)).thenReturn(1L);
            when(userFollowRepository.countByFollowerId(2L)).thenReturn(0L);
            doNothing().when(notificationService).notifyFollow(anyLong(), anyLong(), any());

            // When
            FollowDto.FollowResponse result = followService.follow(1L, 2L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.isFollowing()).isTrue();
            assertThat(result.isMutual()).isFalse();
            assertThat(result.getMessage()).contains("팔로잉");

            verify(userFollowRepository).save(any(UserFollow.class));
            verify(notificationService).notifyFollow(eq(2L), eq(1L), eq("팔로워"));
        }

        @Test
        @DisplayName("성공 - 맞팔로우")
        void follow_Success_MutualFollow() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(follower));
            when(userRepository.findById(2L)).thenReturn(Optional.of(following));
            when(userFollowRepository.existsByFollowerIdAndFollowingId(2L, 1L)).thenReturn(true);
            when(userFollowRepository.countByFollowingId(2L)).thenReturn(1L);
            when(userFollowRepository.countByFollowerId(2L)).thenReturn(1L);
            doNothing().when(notificationService).notifyFollow(anyLong(), anyLong(), any());

            // When
            FollowDto.FollowResponse result = followService.follow(1L, 2L);

            // Then
            assertThat(result.isMutual()).isTrue();
        }

        @Test
        @DisplayName("실패 - 자기 자신 팔로우")
        void follow_Fail_SelfFollow() {
            // When & Then
            assertThatThrownBy(() -> followService.follow(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("자기 자신을 팔로우할 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 이미 팔로우 중")
        void follow_Fail_AlreadyFollowing() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> followService.follow(1L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 팔로우 중입니다")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("실패 - 팔로워 사용자 없음")
        void follow_Fail_FollowerNotFound() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> followService.follow(1L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }

        @Test
        @DisplayName("실패 - 팔로우 대상 사용자 없음")
        void follow_Fail_FollowingNotFound() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(follower));
            when(userRepository.findById(2L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> followService.follow(1L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("언팔로우 테스트")
    class UnfollowTest {

        @Test
        @DisplayName("성공 - 정상 언팔로우")
        void unfollow_Success() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);
            when(userFollowRepository.deleteByFollowerIdAndFollowingId(1L, 2L)).thenReturn(1);
            when(userRepository.findById(2L)).thenReturn(Optional.of(following));
            when(userFollowRepository.countByFollowingId(2L)).thenReturn(0L);
            when(userFollowRepository.countByFollowerId(2L)).thenReturn(0L);

            // When
            FollowDto.FollowResponse result = followService.unfollow(1L, 2L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.isFollowing()).isFalse();
            assertThat(result.isMutual()).isFalse();
            assertThat(result.getMessage()).contains("언팔로우");

            verify(userFollowRepository).deleteByFollowerIdAndFollowingId(1L, 2L);
        }

        @Test
        @DisplayName("실패 - 팔로우 관계 없음")
        void unfollow_Fail_NotFollowing() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> followService.unfollow(1L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("팔로우 관계가 존재하지 않습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("팔로워 목록 조회 테스트")
    class GetFollowersTest {

        @Test
        @DisplayName("성공 - 팔로워 목록 조회")
        void getFollowers_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            UserFollow follow = UserFollow.builder()
                    .id(1L)
                    .follower(follower)
                    .following(following)
                    .createdAt(LocalDateTime.now())
                    .build();

            Page<UserFollow> followPage = new PageImpl<>(List.of(follow), pageable, 1);
            when(userFollowRepository.findByFollowingId(2L, pageable)).thenReturn(followPage);
            when(userFollowRepository.findFollowingIdsInUserIds(anyLong(), any())).thenReturn(List.of());

            // When
            Page<FollowDto.FollowUserResponse> result = followService.getFollowers(2L, 3L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getNickname()).isEqualTo("팔로워");
        }

        @Test
        @DisplayName("성공 - 빈 팔로워 목록")
        void getFollowers_Empty() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<UserFollow> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(userFollowRepository.findByFollowingId(2L, pageable)).thenReturn(emptyPage);

            // When
            Page<FollowDto.FollowUserResponse> result = followService.getFollowers(2L, null, pageable);

            // Then
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }
    }

    @Nested
    @DisplayName("팔로잉 목록 조회 테스트")
    class GetFollowingTest {

        @Test
        @DisplayName("성공 - 팔로잉 목록 조회")
        void getFollowing_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            UserFollow follow = UserFollow.builder()
                    .id(1L)
                    .follower(follower)
                    .following(following)
                    .createdAt(LocalDateTime.now())
                    .build();

            Page<UserFollow> followPage = new PageImpl<>(List.of(follow), pageable, 1);
            when(userFollowRepository.findByFollowerId(1L, pageable)).thenReturn(followPage);
            when(userFollowRepository.findFollowingIdsInUserIds(anyLong(), any())).thenReturn(List.of());
            when(userFollowRepository.existsByFollowerIdAndFollowingId(2L, 1L)).thenReturn(false);

            // When
            Page<FollowDto.FollowUserResponse> result = followService.getFollowing(1L, 3L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getNickname()).isEqualTo("팔로잉");
        }
    }

    @Nested
    @DisplayName("팔로우 통계 조회 테스트")
    class GetFollowStatsTest {

        @Test
        @DisplayName("성공 - 팔로우 통계 조회")
        void getFollowStats_Success() {
            // Given
            when(userFollowRepository.countByFollowingId(1L)).thenReturn(10L);
            when(userFollowRepository.countByFollowerId(1L)).thenReturn(5L);

            // When
            FollowDto.FollowStatsResponse result = followService.getFollowStats(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(1L);
            assertThat(result.getFollowerCount()).isEqualTo(10L);
            assertThat(result.getFollowingCount()).isEqualTo(5L);
        }
    }

    @Nested
    @DisplayName("팔로우 상태 조회 테스트")
    class GetFollowStatusTest {

        @Test
        @DisplayName("성공 - 맞팔 상태")
        void getFollowStatus_MutualFollow() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);
            when(userFollowRepository.existsByFollowerIdAndFollowingId(2L, 1L)).thenReturn(true);

            // When
            FollowDto.FollowStatusResponse result = followService.getFollowStatus(1L, 2L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.isFollowing()).isTrue();
            assertThat(result.isFollowedBy()).isTrue();
            assertThat(result.isMutual()).isTrue();
        }

        @Test
        @DisplayName("성공 - 단방향 팔로우")
        void getFollowStatus_OneWay() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);
            when(userFollowRepository.existsByFollowerIdAndFollowingId(2L, 1L)).thenReturn(false);

            // When
            FollowDto.FollowStatusResponse result = followService.getFollowStatus(1L, 2L);

            // Then
            assertThat(result.isFollowing()).isTrue();
            assertThat(result.isFollowedBy()).isFalse();
            assertThat(result.isMutual()).isFalse();
        }

        @Test
        @DisplayName("성공 - 팔로우 관계 없음")
        void getFollowStatus_NoRelation() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);
            when(userFollowRepository.existsByFollowerIdAndFollowingId(2L, 1L)).thenReturn(false);

            // When
            FollowDto.FollowStatusResponse result = followService.getFollowStatus(1L, 2L);

            // Then
            assertThat(result.isFollowing()).isFalse();
            assertThat(result.isFollowedBy()).isFalse();
            assertThat(result.isMutual()).isFalse();
        }
    }

    @Nested
    @DisplayName("팔로우 여부 확인 테스트")
    class IsFollowingTest {

        @Test
        @DisplayName("성공 - 팔로우 중")
        void isFollowing_True() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);

            // When
            boolean result = followService.isFollowing(1L, 2L);

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("성공 - 팔로우 안함")
        void isFollowing_False() {
            // Given
            when(userFollowRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);

            // When
            boolean result = followService.isFollowing(1L, 2L);

            // Then
            assertThat(result).isFalse();
        }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
