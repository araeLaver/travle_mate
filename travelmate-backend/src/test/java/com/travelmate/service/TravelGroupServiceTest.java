package com.travelmate.service;

import com.travelmate.dto.TravelGroupDto;
import com.travelmate.entity.GroupMember;
import com.travelmate.entity.TravelGroup;
import com.travelmate.entity.User;
import com.travelmate.exception.TravelGroupException;
import com.travelmate.repository.GroupMemberRepository;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TravelGroupService 테스트")
class TravelGroupServiceTest {

    @Mock
    private TravelGroupRepository travelGroupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ChatService chatService;

    @InjectMocks
    private TravelGroupService travelGroupService;

    private User leader;
    private User member;
    private TravelGroup testGroup;
    private GroupMember leaderMember;
    private TravelGroupDto.CreateRequest createRequest;

    @BeforeEach
    void setUp() {
        leader = new User();
        leader.setId(1L);
        leader.setEmail("leader@example.com");
        leader.setNickname("leader");
        leader.setIsActive(true);

        member = new User();
        member.setId(2L);
        member.setEmail("member@example.com");
        member.setNickname("member");
        member.setIsActive(true);

        testGroup = new TravelGroup();
        testGroup.setId(1L);
        testGroup.setName("제주도 여행");
        testGroup.setDescription("제주도 맛집 탐방");
        testGroup.setDestination("제주도");
        testGroup.setStartDate(LocalDate.now().plusDays(7));
        testGroup.setEndDate(LocalDate.now().plusDays(10));
        testGroup.setMaxMembers(5);
        testGroup.setCurrentMembers(1);
        testGroup.setStatus(TravelGroup.GroupStatus.RECRUITING);

        leaderMember = new GroupMember();
        leaderMember.setId(1L);
        leaderMember.setGroup(testGroup);
        leaderMember.setUser(leader);
        leaderMember.setRole(GroupMember.MemberRole.LEADER);
        leaderMember.setStatus(GroupMember.MemberStatus.APPROVED);

        createRequest = new TravelGroupDto.CreateRequest();
        createRequest.setName("새 여행 그룹");
        createRequest.setDescription("새로운 여행");
        createRequest.setDestination("부산");
        createRequest.setStartDate(LocalDate.now().plusDays(14));
        createRequest.setEndDate(LocalDate.now().plusDays(17));
        createRequest.setMaxMembers(4);
    }

    @Nested
    @DisplayName("그룹 생성 테스트")
    class CreateGroupTest {

        @Test
        @DisplayName("성공 - 정상적인 그룹 생성")
        void createGroup_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(leader));
            when(travelGroupRepository.save(any(TravelGroup.class))).thenAnswer(invocation -> {
                TravelGroup group = invocation.getArgument(0);
                group.setId(1L);
                return group;
            });
            when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(invocation -> {
                GroupMember gm = invocation.getArgument(0);
                gm.setId(1L);
                return gm;
            });

            // When
            TravelGroupDto.Response result = travelGroupService.createGroup(1L, createRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo(createRequest.getName());
            assertThat(result.getDestination()).isEqualTo(createRequest.getDestination());
            verify(travelGroupRepository).save(any(TravelGroup.class));
            verify(groupMemberRepository).save(any(GroupMember.class));
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 사용자")
        void createGroup_Fail_UserNotFound() {
            // Given
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> travelGroupService.createGroup(999L, createRequest))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("실패 - 종료일이 시작일보다 이전")
        void createGroup_Fail_InvalidDates() {
            // Given
            createRequest.setEndDate(LocalDate.now().plusDays(10));
            createRequest.setStartDate(LocalDate.now().plusDays(14));
            when(userRepository.findById(1L)).thenReturn(Optional.of(leader));

            // When & Then
            assertThatThrownBy(() -> travelGroupService.createGroup(1L, createRequest))
                    .isInstanceOf(TravelGroupException.class);
        }
    }

    @Nested
    @DisplayName("그룹 가입 테스트")
    class JoinGroupTest {

        @Test
        @DisplayName("성공 - 그룹 가입")
        void joinGroup_Success() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(member));
            when(groupMemberRepository.existsByGroupIdAndUserId(1L, 2L)).thenReturn(false);
            when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(invocation -> {
                GroupMember gm = invocation.getArgument(0);
                gm.setId(2L);
                return gm;
            });

            // When
            travelGroupService.joinGroup(2L, 1L);

            // Then
            verify(groupMemberRepository).save(any(GroupMember.class));
            verify(travelGroupRepository).save(argThat(group -> group.getCurrentMembers() == 2));
        }

        @Test
        @DisplayName("실패 - 이미 가입한 그룹")
        void joinGroup_Fail_AlreadyMember() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(member));
            when(groupMemberRepository.existsByGroupIdAndUserId(1L, 2L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> travelGroupService.joinGroup(2L, 1L))
                    .isInstanceOf(TravelGroupException.class)
                    .hasMessageContaining("이미");
        }

        @Test
        @DisplayName("실패 - 정원 초과")
        void joinGroup_Fail_GroupFull() {
            // Given
            testGroup.setCurrentMembers(5);
            testGroup.setMaxMembers(5);
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(member));
            when(groupMemberRepository.existsByGroupIdAndUserId(1L, 2L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> travelGroupService.joinGroup(2L, 1L))
                    .isInstanceOf(TravelGroupException.class)
                    .hasMessageContaining("정원");
        }

        @Test
        @DisplayName("실패 - 모집 완료된 그룹")
        void joinGroup_Fail_NotRecruiting() {
            // Given
            testGroup.setStatus(TravelGroup.GroupStatus.IN_PROGRESS);
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(member));
            when(groupMemberRepository.existsByGroupIdAndUserId(1L, 2L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> travelGroupService.joinGroup(2L, 1L))
                    .isInstanceOf(TravelGroupException.class)
                    .hasMessageContaining("모집");
        }
    }

    @Nested
    @DisplayName("그룹 탈퇴 테스트")
    class LeaveGroupTest {

        @Test
        @DisplayName("성공 - 일반 멤버 탈퇴")
        void leaveGroup_Success() {
            // Given
            GroupMember memberRecord = new GroupMember();
            memberRecord.setId(2L);
            memberRecord.setGroup(testGroup);
            memberRecord.setUser(member);
            memberRecord.setRole(GroupMember.MemberRole.MEMBER);

            testGroup.setCurrentMembers(2);

            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(1L, 2L)).thenReturn(Optional.of(memberRecord));

            // When
            travelGroupService.leaveGroup(2L, 1L);

            // Then
            verify(groupMemberRepository).delete(memberRecord);
            verify(travelGroupRepository).save(argThat(group -> group.getCurrentMembers() == 1));
        }

        @Test
        @DisplayName("실패 - 리더는 탈퇴 불가")
        void leaveGroup_Fail_LeaderCannotLeave() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(leaderMember));

            // When & Then
            assertThatThrownBy(() -> travelGroupService.leaveGroup(1L, 1L))
                    .isInstanceOf(TravelGroupException.class)
                    .hasMessageContaining("리더");
        }
    }

    @Nested
    @DisplayName("그룹 조회 테스트")
    class GetGroupsTest {

        @Test
        @DisplayName("모집 중인 그룹 목록 조회")
        void getRecruitingGroups() {
            // Given
            List<TravelGroup> groups = Arrays.asList(testGroup);
            when(travelGroupRepository.findByStatusOrderByCreatedAtDesc(TravelGroup.GroupStatus.RECRUITING))
                    .thenReturn(groups);

            // When
            List<TravelGroupDto.Response> result = travelGroupService.getRecruitingGroups();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(TravelGroup.GroupStatus.RECRUITING);
        }

        @Test
        @DisplayName("사용자의 그룹 목록 조회")
        void getMyGroups() {
            // Given
            List<GroupMember> memberships = Arrays.asList(leaderMember);
            when(groupMemberRepository.findByUserId(1L)).thenReturn(memberships);

            // When
            List<TravelGroupDto.Response> result = travelGroupService.getMyGroups(1L);

            // Then
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("그룹 상세 조회")
        void getGroupDetail() {
            // Given
            List<GroupMember> members = Arrays.asList(leaderMember);
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupId(1L)).thenReturn(members);

            // When
            TravelGroupDto.DetailResponse result = travelGroupService.getGroupDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo(testGroup.getName());
            assertThat(result.getMembers()).hasSize(1);
        }
    }
}
