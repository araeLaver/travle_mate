package com.travelmate.service;

import com.travelmate.dto.UserBlockDto;
import com.travelmate.entity.User;
import com.travelmate.entity.UserBlock;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserBlockRepository;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserBlockService 테스트")
class UserBlockServiceTest {

    @Mock private UserBlockRepository userBlockRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserFollowRepository userFollowRepository;

    @InjectMocks private UserBlockService userBlockService;

    private User user1, user2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setEmail("alice@test.com");
        user1.setNickname("Alice");
        setId(user1, 1L);
        user2 = new User();
        user2.setEmail("bob@test.com");
        user2.setNickname("Bob");
        setId(user2, 2L);
    }

    @Nested
    @DisplayName("blockUser")
    class BlockUser {

        @Test
        @DisplayName("정상 차단")
        void success() {
            var req = new UserBlockDto.BlockRequest();
            req.setUserId(2L);
            req.setReason("스팸");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
            when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
            when(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(false);
            when(userBlockRepository.save(any())).thenAnswer(i -> {
                UserBlock b = i.getArgument(0);
                setBlockId(b, 10L);
                return b;
            });

            var result = userBlockService.blockUser(1L, req);

            assertThat(result).isNotNull();
            verify(userFollowRepository).deleteByFollowerIdAndFollowingId(1L, 2L);
            verify(userFollowRepository).deleteByFollowerIdAndFollowingId(2L, 1L);
        }

        @Test
        @DisplayName("자기 차단 불가")
        void failSelfBlock() {
            var req = new UserBlockDto.BlockRequest();
            req.setUserId(1L);

            assertThatThrownBy(() -> userBlockService.blockUser(1L, req))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("자기 자신");
        }

        @Test
        @DisplayName("이미 차단한 사용자 재차단 불가")
        void failDuplicate() {
            var req = new UserBlockDto.BlockRequest();
            req.setUserId(2L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
            when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
            when(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(true);

            assertThatThrownBy(() -> userBlockService.blockUser(1L, req))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 차단");
        }
    }

    @Nested
    @DisplayName("unblockUser")
    class UnblockUser {

        @Test
        @DisplayName("정상 차단 해제")
        void success() {
            when(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(true);

            userBlockService.unblockUser(1L, 2L);

            verify(userBlockRepository).deleteByBlockerIdAndBlockedId(1L, 2L);
        }

        @Test
        @DisplayName("차단하지 않은 사용자 해제 실패")
        void failNotBlocked() {
            when(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(false);

            assertThatThrownBy(() -> userBlockService.unblockUser(1L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("차단하지 않은");
        }
    }

    @Nested
    @DisplayName("toggleBlock")
    class ToggleBlock {

        @Test
        @DisplayName("차단 → 차단 해제 토글")
        void toggleToUnblock() {
            when(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(true);

            var result = userBlockService.toggleBlock(1L, 2L);

            assertThat(result.isBlocked()).isFalse();
            verify(userBlockRepository).deleteByBlockerIdAndBlockedId(1L, 2L);
        }

        @Test
        @DisplayName("비차단 → 차단 토글")
        void toggleToBlock() {
            when(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
            when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
            when(userBlockRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = userBlockService.toggleBlock(1L, 2L);

            assertThat(result.isBlocked()).isTrue();
        }

        @Test
        @DisplayName("자기 토글 불가")
        void failSelf() {
            assertThatThrownBy(() -> userBlockService.toggleBlock(1L, 1L))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("getBlockStatus")
    class GetBlockStatus {

        @Test
        @DisplayName("양방향 차단 상태 조회")
        void bothBlocked() {
            when(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(true);
            when(userBlockRepository.existsByBlockerIdAndBlockedId(2L, 1L)).thenReturn(true);

            var result = userBlockService.getBlockStatus(1L, 2L);

            assertThat(result.isBlocked()).isTrue();
            assertThat(result.isBlockedBy()).isTrue();
            assertThat(result.isEitherBlocked()).isTrue();
        }

        @Test
        @DisplayName("차단 없음")
        void neitherBlocked() {
            when(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(false);
            when(userBlockRepository.existsByBlockerIdAndBlockedId(2L, 1L)).thenReturn(false);

            var result = userBlockService.getBlockStatus(1L, 2L);

            assertThat(result.isBlocked()).isFalse();
            assertThat(result.isBlockedBy()).isFalse();
            assertThat(result.isEitherBlocked()).isFalse();
        }
    }

    @Test
    @DisplayName("getBlockedUsers — 페이지네이션")
    void getBlockedUsers() {
        UserBlock block = UserBlock.builder().blocker(user1).blocked(user2).build();
        setBlockId(block, 10L);
        var page = new PageImpl<>(List.of(block));
        when(userBlockRepository.findByBlockerId(eq(1L), any())).thenReturn(page);

        var result = userBlockService.getBlockedUsers(1L, PageRequest.of(0, 10));

        assertThat(result.getBlocks()).hasSize(1);
        assertThat(result.getTotalCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("getBatchBlockStatus — 일괄 조회")
    void batchStatus() {
        var req = new UserBlockDto.BatchStatusRequest();
        req.setUserIds(List.of(2L, 3L, 4L));
        when(userBlockRepository.findBlockedUserIdsInUserIds(1L, List.of(2L, 3L, 4L)))
                .thenReturn(List.of(2L));

        var result = userBlockService.getBatchBlockStatus(1L, req);

        assertThat(result.getBlockStatus().get(2L)).isTrue();
        assertThat(result.getBlockStatus().get(3L)).isFalse();
        assertThat(result.getBlockStatus().get(4L)).isFalse();
    }

    @Test
    @DisplayName("isBlockedEitherWay 위임")
    void isBlockedEitherWay() {
        when(userBlockRepository.isBlockedEitherWay(1L, 2L)).thenReturn(true);

        assertThat(userBlockService.isBlockedEitherWay(1L, 2L)).isTrue();
    }

    // --- Reflection helpers ---
    private void setId(User user, Long id) {
        try { var f = User.class.getDeclaredField("id"); f.setAccessible(true); f.set(user, id); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
    private void setBlockId(UserBlock b, Long id) {
        try { var f = UserBlock.class.getDeclaredField("id"); f.setAccessible(true); f.set(b, id); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
}
