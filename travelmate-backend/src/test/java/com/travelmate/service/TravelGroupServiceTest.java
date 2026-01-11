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
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @InjectMocks
    private TravelGroupService travelGroupService;

    private User creator;
    private User member;
    private TravelGroup testGroup;
    private GroupMember creatorMember;
    private TravelGroupDto.CreateRequest createRequest;

    @BeforeEach
    void setUp() {
        creator = new User();
        creator.setId(1L);
        creator.setEmail("creator@example.com");
        creator.setNickname("creator");
        creator.setIsActive(true);

        member = new User();
        member.setId(2L);
        member.setEmail("member@example.com");
        member.setNickname("member");
        member.setIsActive(true);

        testGroup = new TravelGroup();
        testGroup.setId(1L);
        testGroup.setTitle("제주도 여행");
        testGroup.setDescription("제주도 맛집 탐방");
        testGroup.setDestination("제주도");
        testGroup.setStartDate(LocalDate.now().plusDays(7));
        testGroup.setEndDate(LocalDate.now().plusDays(10));
        testGroup.setMaxMembers(5);
        testGroup.setCurrentMembers(1);
        testGroup.setStatus(TravelGroup.Status.RECRUITING);
        testGroup.setCreator(creator);
        testGroup.setMembers(new ArrayList<>());

        creatorMember = new GroupMember();
        creatorMember.setId(1L);
        creatorMember.setTravelGroup(testGroup);
        creatorMember.setUser(creator);
        creatorMember.setRole(GroupMember.Role.CREATOR);
        creatorMember.setStatus(GroupMember.Status.ACCEPTED);

        testGroup.getMembers().add(creatorMember);

        createRequest = new TravelGroupDto.CreateRequest();
        createRequest.setTitle("새 여행 그룹");
        createRequest.setDescription("새로운 여행");
        createRequest.setDestination("부산");
        createRequest.setStartDate(LocalDate.now().plusDays(14));
        createRequest.setEndDate(LocalDate.now().plusDays(17));
        createRequest.setMaxMembers(4);
        createRequest.setPurpose(TravelGroup.Purpose.LEISURE);
        createRequest.setMeetingLatitude(35.1796);
        createRequest.setMeetingLongitude(129.0756);
        createRequest.setMeetingAddress("부산역");
        createRequest.setScheduledTime(LocalDateTime.now().plusDays(14).withHour(10).withMinute(0));
    }

    @Nested
    @DisplayName("그룹 생성 테스트")
    class CreateGroupTest {

        @Test
        @DisplayName("성공 - 정상적인 그룹 생성")
        void createGroup_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(creator));
            when(travelGroupRepository.save(any(TravelGroup.class))).thenAnswer(invocation -> {
                TravelGroup group = invocation.getArgument(0);
                group.setId(1L);
                group.setMembers(new ArrayList<>());
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
            assertThat(result.getTitle()).isEqualTo(createRequest.getTitle());
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
            when(groupMemberRepository.existsByTravelGroupIdAndUserId(1L, 2L)).thenReturn(false);
            when(groupMemberRepository.countAcceptedMembersByGroupId(1L)).thenReturn(1L);
            when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(invocation -> {
                GroupMember gm = invocation.getArgument(0);
                gm.setId(2L);
                return gm;
            });

            // When
            travelGroupService.joinGroup(1L, 2L);

            // Then
            verify(groupMemberRepository).save(any(GroupMember.class));
            verify(notificationService).sendNotification(eq(1L), anyString());
        }

        @Test
        @DisplayName("실패 - 이미 가입한 그룹")
        void joinGroup_Fail_AlreadyMember() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(member));
            when(groupMemberRepository.existsByTravelGroupIdAndUserId(1L, 2L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> travelGroupService.joinGroup(1L, 2L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("이미");
        }

        @Test
        @DisplayName("실패 - 정원 초과")
        void joinGroup_Fail_GroupFull() {
            // Given
            testGroup.setMaxMembers(5);
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(member));
            when(groupMemberRepository.existsByTravelGroupIdAndUserId(1L, 2L)).thenReturn(false);
            when(groupMemberRepository.countAcceptedMembersByGroupId(1L)).thenReturn(5L);

            // When & Then
            assertThatThrownBy(() -> travelGroupService.joinGroup(1L, 2L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("가득");
        }

        @Test
        @DisplayName("실패 - 모집 완료된 그룹")
        void joinGroup_Fail_NotRecruiting() {
            // Given
            testGroup.setStatus(TravelGroup.Status.ACTIVE);
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(member));
            when(groupMemberRepository.existsByTravelGroupIdAndUserId(1L, 2L)).thenReturn(false);
            when(groupMemberRepository.countAcceptedMembersByGroupId(1L)).thenReturn(1L);

            // When & Then
            assertThatThrownBy(() -> travelGroupService.joinGroup(1L, 2L))
                    .isInstanceOf(RuntimeException.class)
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
            memberRecord.setTravelGroup(testGroup);
            memberRecord.setUser(member);
            memberRecord.setRole(GroupMember.Role.MEMBER);
            memberRecord.setStatus(GroupMember.Status.ACCEPTED);

            when(groupMemberRepository.findByTravelGroupIdAndUserId(1L, 2L)).thenReturn(Optional.of(memberRecord));

            // When
            travelGroupService.leaveGroup(1L, 2L);

            // Then
            verify(groupMemberRepository).delete(memberRecord);
        }

        @Test
        @DisplayName("실패 - 생성자는 탈퇴 불가")
        void leaveGroup_Fail_CreatorCannotLeave() {
            // Given
            when(groupMemberRepository.findByTravelGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(creatorMember));

            // When & Then
            assertThatThrownBy(() -> travelGroupService.leaveGroup(1L, 1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("생성자");
        }
    }

    @Nested
    @DisplayName("그룹 조회 테스트")
    class GetGroupsTest {

        @Test
        @DisplayName("그룹 상세 조회")
        void getGroupDetail() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.existsByTravelGroupIdAndUserId(eq(1L), any())).thenReturn(false);

            // When
            TravelGroupDto.DetailResponse result = travelGroupService.getGroupDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo(testGroup.getTitle());
            assertThat(result.getMembers()).hasSize(1);
        }

        @Test
        @DisplayName("그룹 상세 조회 - 존재하지 않는 그룹")
        void getGroupDetail_NotFound() {
            // Given
            when(travelGroupRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> travelGroupService.getGroupDetail(999L))
                    .isInstanceOf(TravelGroupException.class);
        }

        @Test
        @DisplayName("내 그룹 목록 조회")
        void getMyGroups() {
            // Given
            List<TravelGroup> groups = List.of(testGroup);
            when(travelGroupRepository.findByUserId(1L)).thenReturn(groups);

            // When
            List<TravelGroupDto.Response> result = travelGroupService.getMyGroups(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTitle()).isEqualTo(testGroup.getTitle());
        }
    }

    @Nested
    @DisplayName("그룹 상태 변경 테스트")
    class UpdateGroupStatusTest {

        @Test
        @DisplayName("성공 - 상태 변경")
        void updateGroupStatus_Success() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(travelGroupRepository.save(any(TravelGroup.class))).thenReturn(testGroup);

            // When
            travelGroupService.updateGroupStatus(1L, 1L, TravelGroup.Status.ACTIVE);

            // Then
            verify(travelGroupRepository).save(testGroup);
            assertThat(testGroup.getStatus()).isEqualTo(TravelGroup.Status.ACTIVE);
        }

        @Test
        @DisplayName("실패 - 생성자가 아닌 사용자")
        void updateGroupStatus_Fail_NotCreator() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

            // When & Then
            assertThatThrownBy(() -> travelGroupService.updateGroupStatus(1L, 2L, TravelGroup.Status.ACTIVE))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("생성자");
        }
    }

    @Nested
    @DisplayName("그룹 삭제 테스트")
    class DeleteGroupTest {

        @Test
        @DisplayName("성공 - 그룹 삭제")
        void deleteGroup_Success() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

            // When
            travelGroupService.deleteGroup(1L, 1L);

            // Then
            verify(travelGroupRepository).delete(testGroup);
        }

        @Test
        @DisplayName("실패 - 생성자가 아닌 사용자")
        void deleteGroup_Fail_NotCreator() {
            // Given
            when(travelGroupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

            // When & Then
            assertThatThrownBy(() -> travelGroupService.deleteGroup(1L, 2L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("생성자");
        }
    }
}
