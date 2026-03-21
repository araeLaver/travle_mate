package com.travelmate.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.ActivityDto;
import com.travelmate.entity.Activity;
import com.travelmate.entity.Post;
import com.travelmate.entity.PostImage;
import com.travelmate.entity.User;
import com.travelmate.entity.UserFollow;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.ActivityRepository;
import com.travelmate.repository.PostRepository;
import com.travelmate.repository.UserFollowRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ActivityService 테스트")
class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserFollowRepository userFollowRepository;

    @Mock
    private PostRepository postRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ActivityService activityService;

    private User testUser;
    private User otherUser;
    private Activity testActivity;
    private Post testPost;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("TestUser");
        testUser.setProfileImageUrl("https://example.com/profile.jpg");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");
        otherUser.setNickname("OtherUser");
        otherUser.setProfileImageUrl("https://example.com/other.jpg");

        testActivity = Activity.builder()
                .id(1L)
                .actor(testUser)
                .type(Activity.ActivityType.POST_CREATED)
                .targetType("POST")
                .targetId(100L)
                .isPublic(true)
                .build();
        testActivity.setCreatedAt(LocalDateTime.now().minusMinutes(30));

        testPost = new Post();
        testPost.setId(100L);
        testPost.setTitle("Test Post");
        testPost.setContent("Test content for the post that is long enough to be truncated...");
    }

    @Nested
    @DisplayName("활동 기록 테스트 (비동기)")
    class RecordActivityAsyncTest {

        @Test
        @DisplayName("성공 - 활동 기록")
        void recordActivity_Success() {
            // Given
            Map<String, Object> metadata = Map.of("key", "value");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(activityRepository.existsByActorAndTypeAndTarget(
                    eq(1L), eq(Activity.ActivityType.POST_CREATED), eq("POST"), eq(100L)))
                    .thenReturn(false);
            when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            activityService.recordActivity(1L, Activity.ActivityType.POST_CREATED, "POST", 100L, metadata);

            // Then
            verify(activityRepository).save(any(Activity.class));
        }

        @Test
        @DisplayName("성공 - 사용자 없으면 기록 안함")
        void recordActivity_UserNotFound() {
            // Given
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When
            activityService.recordActivity(999L, Activity.ActivityType.POST_CREATED, "POST", 100L, null);

            // Then
            verify(activityRepository, never()).save(any(Activity.class));
        }

        @Test
        @DisplayName("성공 - 중복 활동 건너뜀")
        void recordActivity_DuplicateSkipped() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(activityRepository.existsByActorAndTypeAndTarget(
                    eq(1L), eq(Activity.ActivityType.POST_CREATED), eq("POST"), eq(100L)))
                    .thenReturn(true);

            // When
            activityService.recordActivity(1L, Activity.ActivityType.POST_CREATED, "POST", 100L, null);

            // Then
            verify(activityRepository, never()).save(any(Activity.class));
        }

        @Test
        @DisplayName("성공 - target 없이 활동 기록")
        void recordActivity_NoTarget() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            activityService.recordActivity(1L, Activity.ActivityType.USER_JOINED, null, null, null);

            // Then
            verify(activityRepository).save(any(Activity.class));
        }

        @Test
        @DisplayName("성공 - 예외 발생해도 에러 로깅만 함")
        void recordActivity_ExceptionHandled() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(activityRepository.existsByActorAndTypeAndTarget(anyLong(), any(), anyString(), anyLong()))
                    .thenReturn(false);
            when(activityRepository.save(any(Activity.class))).thenThrow(new RuntimeException("DB Error"));

            // When & Then - 예외가 발생해도 메서드는 정상 종료
            assertThatCode(() -> activityService.recordActivity(
                    1L, Activity.ActivityType.POST_CREATED, "POST", 100L, null))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("활동 기록 테스트 (동기)")
    class RecordActivitySyncTest {

        @Test
        @DisplayName("성공 - 동기 활동 기록")
        void recordActivitySync_Success() {
            // Given
            Map<String, Object> metadata = Map.of("key", "value");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            activityService.recordActivitySync(1L, Activity.ActivityType.NFT_COLLECTED, "LOCATION", 50L, metadata);

            // Then
            verify(activityRepository).save(any(Activity.class));
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void recordActivitySync_UserNotFound() {
            // Given
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> activityService.recordActivitySync(
                    999L, Activity.ActivityType.USER_JOINED, null, null, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("사용자를 찾을 수 없습니다.");
        }
    }

    @Nested
    @DisplayName("타임라인 피드 조회 테스트")
    class GetMyTimelineTest {

        @Test
        @DisplayName("성공 - 타임라인 조회")
        void getMyTimeline_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);

            UserFollow follow = UserFollow.builder()
                    .id(1L)
                    .follower(testUser)
                    .following(otherUser)
                    .build();

            Page<UserFollow> followPage = new PageImpl<>(List.of(follow));
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 1);

            when(userFollowRepository.findByFollowerId(eq(1L), any(Pageable.class))).thenReturn(followPage);
            when(activityRepository.findTimelineFeed(eq(1L), anyList(), any(Pageable.class))).thenReturn(activityPage);

            // When
            ActivityDto.TimelineResponse result = activityService.getMyTimeline(1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(1L);
            assertThat(result.getActivities()).hasSize(1);
            assertThat(result.getTotalCount()).isEqualTo(1);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(10);
        }

        @Test
        @DisplayName("성공 - 팔로잉 없음")
        void getMyTimeline_NoFollowing() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);

            Page<UserFollow> emptyFollowPage = new PageImpl<>(List.of());
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 1);

            when(userFollowRepository.findByFollowerId(eq(1L), any(Pageable.class))).thenReturn(emptyFollowPage);
            when(activityRepository.findTimelineFeed(eq(1L), anyList(), any(Pageable.class))).thenReturn(activityPage);

            // When
            ActivityDto.TimelineResponse result = activityService.getMyTimeline(1L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("사용자 활동 조회 테스트")
    class GetUserActivitiesTest {

        @Test
        @DisplayName("성공 - 본인 활동 조회 (모든 활동)")
        void getUserActivities_OwnActivities() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
            verify(activityRepository).findByActorId(1L, pageable);
        }

        @Test
        @DisplayName("성공 - 다른 사용자 활동 조회 (공개 활동만)")
        void getUserActivities_OtherUserActivities() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 1);

            when(activityRepository.findPublicByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 2L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
            verify(activityRepository).findPublicByActorId(1L, pageable);
        }
    }

    @Nested
    @DisplayName("탐색 피드 조회 테스트")
    class GetExploreFeedTest {

        @Test
        @DisplayName("성공 - 탐색 피드 조회")
        void getExploreFeed_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 1);

            when(activityRepository.findPublicFeed(pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getExploreFeed(pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getActivities()).hasSize(1);
            assertThat(result.isHasMore()).isFalse();
        }

        @Test
        @DisplayName("성공 - 더 많은 결과가 있음")
        void getExploreFeed_HasMore() {
            // Given
            Pageable pageable = PageRequest.of(0, 1);
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 10);

            when(activityRepository.findPublicFeed(pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getExploreFeed(pageable);

            // Then
            assertThat(result.isHasMore()).isTrue();
            assertThat(result.getTotalCount()).isEqualTo(10);
        }
    }

    @Nested
    @DisplayName("타입별 활동 조회 테스트")
    class GetActivitiesByTypeTest {

        @Test
        @DisplayName("성공 - 타입별 활동 조회")
        void getActivitiesByType_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 1);

            when(activityRepository.findByType(Activity.ActivityType.POST_CREATED, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getActivitiesByType(
                    Activity.ActivityType.POST_CREATED, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("사용자 활동 통계 조회 테스트")
    class GetUserActivityStatsTest {

        @Test
        @DisplayName("성공 - 활동 통계 조회")
        void getUserActivityStats_Success() {
            // Given
            List<Object[]> stats = List.of(
                    new Object[]{Activity.ActivityType.POST_CREATED, 10L},
                    new Object[]{Activity.ActivityType.NFT_COLLECTED, 5L}
            );

            Page<Activity> lastActivityPage = new PageImpl<>(List.of(testActivity));

            when(activityRepository.getActivityStatsByUser(1L)).thenReturn(stats);
            when(activityRepository.countRecentActivities(eq(1L), any(LocalDateTime.class))).thenReturn(8L);
            when(activityRepository.findByActorId(eq(1L), any(Pageable.class))).thenReturn(lastActivityPage);

            // When
            ActivityDto.StatsResponse result = activityService.getUserActivityStats(1L);

            // Then
            assertThat(result.getUserId()).isEqualTo(1L);
            assertThat(result.getTotalActivities()).isEqualTo(15L);
            assertThat(result.getRecentActivities()).isEqualTo(8L);
            assertThat(result.getActivityByType()).containsKey("POST_CREATED");
            assertThat(result.getActivityByType().get("POST_CREATED")).isEqualTo(10L);
            assertThat(result.getLastActivityAt()).isNotNull();
        }

        @Test
        @DisplayName("성공 - 활동 없음")
        void getUserActivityStats_NoActivities() {
            // Given
            List<Object[]> stats = List.of();
            Page<Activity> emptyPage = new PageImpl<>(List.of());

            when(activityRepository.getActivityStatsByUser(1L)).thenReturn(stats);
            when(activityRepository.countRecentActivities(eq(1L), any(LocalDateTime.class))).thenReturn(0L);
            when(activityRepository.findByActorId(eq(1L), any(Pageable.class))).thenReturn(emptyPage);

            // When
            ActivityDto.StatsResponse result = activityService.getUserActivityStats(1L);

            // Then
            assertThat(result.getTotalActivities()).isEqualTo(0L);
            assertThat(result.getActivityByType()).isEmpty();
            assertThat(result.getLastActivityAt()).isNull();
        }
    }

    @Nested
    @DisplayName("대상 정보 변환 테스트")
    class ToTargetInfoTest {

        @Test
        @DisplayName("성공 - POST 타입 대상 정보")
        void toTargetInfo_PostType() {
            // Given
            testActivity.setTargetType("POST");
            testActivity.setTargetId(100L);

            PostImage image = new PostImage();
            image.setImageUrl("https://example.com/image.jpg");
            testPost.setImages(List.of(image));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);
            when(postRepository.findById(100L)).thenReturn(Optional.of(testPost));

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
            assertThat(result.getActivities().get(0).getTarget()).isNotNull();
            assertThat(result.getActivities().get(0).getTarget().getTitle()).isEqualTo("Test Post");
        }

        @Test
        @DisplayName("성공 - USER 타입 대상 정보")
        void toTargetInfo_UserType() {
            // Given
            Activity userActivity = Activity.builder()
                    .id(2L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_FOLLOWED)
                    .targetType("USER")
                    .targetId(2L)
                    .isPublic(true)
                    .build();
            userActivity.setCreatedAt(LocalDateTime.now().minusHours(1));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(userActivity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
            assertThat(result.getActivities().get(0).getTarget()).isNotNull();
            assertThat(result.getActivities().get(0).getTarget().getTitle()).isEqualTo("OtherUser");
        }

        @Test
        @DisplayName("성공 - 대상 없는 활동")
        void toTargetInfo_NoTarget() {
            // Given
            Activity noTargetActivity = Activity.builder()
                    .id(3L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .targetType(null)
                    .targetId(null)
                    .isPublic(true)
                    .build();
            noTargetActivity.setCreatedAt(LocalDateTime.now());

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(noTargetActivity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
            assertThat(result.getActivities().get(0).getTarget()).isNull();
        }

        @Test
        @DisplayName("성공 - 대상 조회 실패해도 계속 진행")
        void toTargetInfo_TargetLookupFailed() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(testActivity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);
            when(postRepository.findById(100L)).thenThrow(new RuntimeException("DB Error"));

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
            // 대상 정보가 없어도 활동은 조회됨
        }
    }

    @Nested
    @DisplayName("상대 시간 변환 테스트")
    class RelativeTimeTest {

        @Test
        @DisplayName("성공 - 방금 전")
        void getRelativeTime_JustNow() {
            // Given
            Activity recentActivity = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .isPublic(true)
                    .build();
            recentActivity.setCreatedAt(LocalDateTime.now().minusSeconds(30));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(recentActivity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities().get(0).getRelativeTime()).isEqualTo("방금 전");
        }

        @Test
        @DisplayName("성공 - 분 전")
        void getRelativeTime_MinutesAgo() {
            // Given
            Activity activity = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .isPublic(true)
                    .build();
            activity.setCreatedAt(LocalDateTime.now().minusMinutes(30));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities().get(0).getRelativeTime()).contains("분 전");
        }

        @Test
        @DisplayName("성공 - 시간 전")
        void getRelativeTime_HoursAgo() {
            // Given
            Activity activity = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .isPublic(true)
                    .build();
            activity.setCreatedAt(LocalDateTime.now().minusHours(5));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities().get(0).getRelativeTime()).contains("시간 전");
        }

        @Test
        @DisplayName("성공 - 일 전")
        void getRelativeTime_DaysAgo() {
            // Given
            Activity activity = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .isPublic(true)
                    .build();
            activity.setCreatedAt(LocalDateTime.now().minusDays(3));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities().get(0).getRelativeTime()).contains("일 전");
        }

        @Test
        @DisplayName("성공 - 주 전")
        void getRelativeTime_WeeksAgo() {
            // Given
            Activity activity = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .isPublic(true)
                    .build();
            activity.setCreatedAt(LocalDateTime.now().minusWeeks(2));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities().get(0).getRelativeTime()).contains("주 전");
        }

        @Test
        @DisplayName("성공 - 개월 전")
        void getRelativeTime_MonthsAgo() {
            // Given
            Activity activity = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .isPublic(true)
                    .build();
            activity.setCreatedAt(LocalDateTime.now().minusMonths(2));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities().get(0).getRelativeTime()).contains("개월 전");
        }

        @Test
        @DisplayName("성공 - 년 전")
        void getRelativeTime_YearsAgo() {
            // Given
            Activity activity = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .isPublic(true)
                    .build();
            activity.setCreatedAt(LocalDateTime.now().minusYears(2));

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities().get(0).getRelativeTime()).contains("년 전");
        }

        @Test
        @DisplayName("성공 - null 날짜")
        void getRelativeTime_NullDate() {
            // Given
            Activity activity = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .isPublic(true)
                    .build();
            activity.setCreatedAt(null);

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activity), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities().get(0).getRelativeTime()).isEmpty();
        }
    }

    @Nested
    @DisplayName("메타데이터 직렬화/역직렬화 테스트")
    class MetadataSerializationTest {

        @Test
        @DisplayName("성공 - 메타데이터 포함 활동 저장")
        void serializeMetadata_Success() {
            // Given
            Map<String, Object> metadata = Map.of(
                    "locationName", "Seoul Tower",
                    "points", 100
            );

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> {
                Activity saved = invocation.getArgument(0);
                assertThat(saved.getMetadata()).contains("Seoul Tower");
                return saved;
            });

            // When
            activityService.recordActivitySync(1L, Activity.ActivityType.NFT_COLLECTED, "LOCATION", 1L, metadata);

            // Then
            verify(activityRepository).save(any(Activity.class));
        }

        @Test
        @DisplayName("성공 - 빈 메타데이터")
        void serializeMetadata_Empty() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> {
                Activity saved = invocation.getArgument(0);
                assertThat(saved.getMetadata()).isNull();
                return saved;
            });

            // When
            activityService.recordActivitySync(1L, Activity.ActivityType.USER_JOINED, null, null, null);

            // Then
            verify(activityRepository).save(any(Activity.class));
        }

        @Test
        @DisplayName("성공 - 메타데이터 역직렬화")
        void deserializeMetadata_Success() {
            // Given
            Activity activityWithMetadata = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.NFT_COLLECTED)
                    .targetType("LOCATION")
                    .targetId(1L)
                    .metadata("{\"locationName\":\"Seoul Tower\",\"points\":100}")
                    .isPublic(true)
                    .build();
            activityWithMetadata.setCreatedAt(LocalDateTime.now());

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activityWithMetadata), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
            assertThat(result.getActivities().get(0).getMetadata()).containsKey("locationName");
            assertThat(result.getActivities().get(0).getMetadata().get("locationName")).isEqualTo("Seoul Tower");
        }

        @Test
        @DisplayName("성공 - 잘못된 JSON 메타데이터")
        void deserializeMetadata_InvalidJson() {
            // Given
            Activity activityWithBadMetadata = Activity.builder()
                    .id(1L)
                    .actor(testUser)
                    .type(Activity.ActivityType.USER_JOINED)
                    .metadata("{invalid json}")
                    .isPublic(true)
                    .build();
            activityWithBadMetadata.setCreatedAt(LocalDateTime.now());

            Pageable pageable = PageRequest.of(0, 10);
            Page<Activity> activityPage = new PageImpl<>(List.of(activityWithBadMetadata), pageable, 1);

            when(activityRepository.findByActorId(1L, pageable)).thenReturn(activityPage);

            // When
            ActivityDto.FeedResponse result = activityService.getUserActivities(1L, 1L, pageable);

            // Then
            assertThat(result.getActivities()).hasSize(1);
            assertThat(result.getActivities().get(0).getMetadata()).isEmpty();
        }
    }
}
