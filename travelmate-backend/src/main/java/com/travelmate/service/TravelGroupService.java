package com.travelmate.service;

import com.travelmate.dto.TravelGroupDto;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.GroupMember;
import com.travelmate.entity.TravelGroup;
import com.travelmate.entity.User;
import com.travelmate.exception.TravelGroupException;
import com.travelmate.repository.GroupMemberRepository;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TravelGroupService {
    
    private final TravelGroupRepository travelGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    public TravelGroupDto.Response createGroup(Long creatorId, TravelGroupDto.CreateRequest request) {
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        TravelGroup group = new TravelGroup();
        group.setTitle(request.getTitle());
        group.setDescription(request.getDescription());
        group.setDestination(request.getDestination());
        group.setStartDate(request.getStartDate());
        group.setEndDate(request.getEndDate());
        group.setPurpose(request.getPurpose());
        group.setCreator(creator);
        group.setMaxMembers(request.getMaxMembers());
        group.setMeetingLatitude(request.getMeetingLatitude());
        group.setMeetingLongitude(request.getMeetingLongitude());
        group.setMeetingAddress(request.getMeetingAddress());
        group.setScheduledTime(request.getScheduledTime());
        group.setStatus(TravelGroup.Status.RECRUITING);
        
        TravelGroup savedGroup = travelGroupRepository.save(group);
        
        // 생성자를 첫 번째 멤버로 추가
        GroupMember creatorMember = new GroupMember();
        creatorMember.setTravelGroup(savedGroup);
        creatorMember.setUser(creator);
        creatorMember.setRole(GroupMember.Role.CREATOR);
        creatorMember.setStatus(GroupMember.Status.ACCEPTED);
        groupMemberRepository.save(creatorMember);
        
        log.info("새 여행 그룹 생성: {} by {}", savedGroup.getId(), creator.getNickname());
        
        return convertToDto(savedGroup);
    }
    
    @Transactional(readOnly = true)
    public List<TravelGroupDto.Response> getGroups(TravelGroup.Purpose purpose, 
                                                  Double latitude, Double longitude, Double radiusKm) {
        List<TravelGroup> groups = travelGroupRepository.findAvailableGroups(
            purpose, latitude, longitude, radiusKm);
        
        return groups.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public TravelGroupDto.DetailResponse getGroupDetail(Long groupId) {
        TravelGroup group = travelGroupRepository.findById(groupId)
            .orElseThrow(() -> new TravelGroupException("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        
        TravelGroupDto.DetailResponse response = new TravelGroupDto.DetailResponse();
        
        // 기본 정보 설정
        TravelGroupDto.Response basicDto = convertToDto(group);
        response.setId(basicDto.getId());
        response.setTitle(basicDto.getTitle());
        response.setDescription(basicDto.getDescription());
        response.setPurpose(basicDto.getPurpose());
        response.setCreator(basicDto.getCreator());
        response.setMaxMembers(basicDto.getMaxMembers());
        response.setCurrentMemberCount(basicDto.getCurrentMemberCount());
        response.setMeetingLatitude(basicDto.getMeetingLatitude());
        response.setMeetingLongitude(basicDto.getMeetingLongitude());
        response.setMeetingAddress(basicDto.getMeetingAddress());
        response.setScheduledTime(basicDto.getScheduledTime());
        response.setStatus(basicDto.getStatus());
        response.setCreatedAt(basicDto.getCreatedAt());
        
        // 멤버 목록
        List<TravelGroupDto.MemberDto> members = group.getMembers().stream()
            .filter(m -> m.getStatus() == GroupMember.Status.ACCEPTED)
            .map(this::convertMemberToDto)
            .collect(Collectors.toList());
        response.setMembers(members);
        
        // 현재 사용자 참여 여부
        Long currentUserId = getCurrentUserId();
        boolean isJoined = groupMemberRepository.existsByTravelGroupIdAndUserId(groupId, currentUserId);
        response.setIsJoinedByCurrentUser(isJoined);
        
        // 참여 가능 여부
        boolean canJoin = group.getStatus() == TravelGroup.Status.RECRUITING &&
                         members.size() < group.getMaxMembers() &&
                         !isJoined;
        response.setCanJoin(canJoin);
        
        return response;
    }
    
    public void joinGroup(Long groupId, Long userId) {
        TravelGroup group = travelGroupRepository.findById(groupId)
            .orElseThrow(() -> new TravelGroupException("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 이미 참여중인지 확인
        if (groupMemberRepository.existsByTravelGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("이미 참여중인 그룹입니다.");
        }
        
        // 인원 제한 확인
        long currentMembers = groupMemberRepository.countAcceptedMembersByGroupId(groupId);
        if (currentMembers >= group.getMaxMembers()) {
            throw new RuntimeException("그룹 인원이 가득 찼습니다.");
        }
        
        // 그룹 상태 확인
        if (group.getStatus() != TravelGroup.Status.RECRUITING) {
            throw new RuntimeException("모집중인 그룹이 아닙니다.");
        }
        
        GroupMember member = new GroupMember();
        member.setTravelGroup(group);
        member.setUser(user);
        member.setRole(GroupMember.Role.MEMBER);
        member.setStatus(GroupMember.Status.ACCEPTED);
        groupMemberRepository.save(member);
        
        // 그룹 생성자에게 알림
        notificationService.sendNotification(
            group.getCreator().getId(),
            String.format("%s님이 '%s' 그룹에 참여했습니다.", user.getNickname(), group.getTitle())
        );
        
        log.info("그룹 참여: Group {} - User {}", groupId, userId);
    }
    
    public void leaveGroup(Long groupId, Long userId) {
        GroupMember member = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new RuntimeException("그룹 멤버를 찾을 수 없습니다."));
        
        if (member.getRole() == GroupMember.Role.CREATOR) {
            throw new RuntimeException("그룹 생성자는 그룹을 떠날 수 없습니다.");
        }
        
        groupMemberRepository.delete(member);
        
        log.info("그룹 탈퇴: Group {} - User {}", groupId, userId);
    }
    
    public void updateGroupStatus(Long groupId, Long userId, TravelGroup.Status status) {
        TravelGroup group = travelGroupRepository.findById(groupId)
            .orElseThrow(() -> new TravelGroupException("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        
        // 그룹 생성자만 상태 변경 가능
        if (!group.getCreator().getId().equals(userId)) {
            throw new RuntimeException("그룹 생성자만 상태를 변경할 수 있습니다.");
        }
        
        group.setStatus(status);
        travelGroupRepository.save(group);
        
        // 모든 멤버에게 알림
        group.getMembers().stream()
            .filter(m -> m.getStatus() == GroupMember.Status.ACCEPTED)
            .forEach(member -> {
                notificationService.sendNotification(
                    member.getUser().getId(),
                    String.format("'%s' 그룹 상태가 %s로 변경되었습니다.", 
                        group.getTitle(), status.name())
                );
            });
        
        log.info("그룹 상태 변경: {} - {}", groupId, status);
    }
    
    @Transactional(readOnly = true)
    public List<TravelGroupDto.Response> getMyGroups(Long userId) {
        List<TravelGroup> groups = travelGroupRepository.findByUserId(userId);
        
        return groups.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    private TravelGroupDto.Response convertToDto(TravelGroup group) {
        TravelGroupDto.Response dto = new TravelGroupDto.Response();
        dto.setId(group.getId());
        dto.setTitle(group.getTitle());
        dto.setDescription(group.getDescription());
        dto.setPurpose(group.getPurpose());
        dto.setCreator(convertUserToDto(group.getCreator()));
        dto.setMaxMembers(group.getMaxMembers());
        
        // 현재 멤버 수 계산
        long memberCount = group.getMembers() != null ? 
            group.getMembers().stream()
                .filter(m -> m.getStatus() == GroupMember.Status.ACCEPTED)
                .count() : 0;
        dto.setCurrentMemberCount((int) memberCount);
        
        dto.setMeetingLatitude(group.getMeetingLatitude());
        dto.setMeetingLongitude(group.getMeetingLongitude());
        dto.setMeetingAddress(group.getMeetingAddress());
        dto.setScheduledTime(group.getScheduledTime());
        dto.setStatus(group.getStatus());
        dto.setCreatedAt(group.getCreatedAt());
        
        return dto;
    }
    
    private TravelGroupDto.MemberDto convertMemberToDto(GroupMember member) {
        TravelGroupDto.MemberDto dto = new TravelGroupDto.MemberDto();
        dto.setId(member.getId());
        dto.setUser(convertUserToDto(member.getUser()));
        dto.setRole(member.getRole().name());
        dto.setStatus(member.getStatus().name());
        dto.setJoinedAt(member.getJoinedAt());
        return dto;
    }
    
    private UserDto.Response convertUserToDto(User user) {
        return UserDto.Response.builder()
            .id(user.getId())
            .nickname(user.getNickname())
            .profileImageUrl(user.getProfileImageUrl())
            .travelStyle(user.getTravelStyle())
            .build();
    }
    
    private Long getCurrentUserId() {
        // Spring Security Context에서 현재 사용자 ID 추출
        try {
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                return Long.parseLong(auth.getName());
            }
        } catch (Exception e) {
            log.warn("현재 사용자 ID 추출 실패", e);
        }
        return null;
    }
    
    public TravelGroupDto.Response updateGroup(Long groupId, Long userId, TravelGroupDto.UpdateRequest request) {
        TravelGroup group = travelGroupRepository.findById(groupId)
            .orElseThrow(() -> new TravelGroupException("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        
        // 그룹 생성자만 수정 가능
        if (!group.getCreator().getId().equals(userId)) {
            throw new RuntimeException("그룹 생성자만 수정할 수 있습니다.");
        }
        
        if (request.getTitle() != null) {
            group.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getMaxMembers() != null) {
            group.setMaxMembers(request.getMaxMembers());
        }
        if (request.getMeetingLatitude() != null) {
            group.setMeetingLatitude(request.getMeetingLatitude());
        }
        if (request.getMeetingLongitude() != null) {
            group.setMeetingLongitude(request.getMeetingLongitude());
        }
        if (request.getMeetingAddress() != null) {
            group.setMeetingAddress(request.getMeetingAddress());
        }
        if (request.getScheduledTime() != null) {
            group.setScheduledTime(request.getScheduledTime());
        }
        
        TravelGroup savedGroup = travelGroupRepository.save(group);
        log.info("그룹 정보 업데이트: {} by {}", groupId, userId);
        
        return convertToDto(savedGroup);
    }
    
    public void deleteGroup(Long groupId, Long userId) {
        TravelGroup group = travelGroupRepository.findById(groupId)
            .orElseThrow(() -> new TravelGroupException("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        
        // 그룹 생성자만 삭제 가능
        if (!group.getCreator().getId().equals(userId)) {
            throw new RuntimeException("그룹 생성자만 삭제할 수 있습니다.");
        }
        
        // 모든 멤버에게 삭제 알림
        group.getMembers().stream()
            .filter(m -> m.getStatus() == GroupMember.Status.ACCEPTED)
            .forEach(member -> {
                if (!member.getUser().getId().equals(userId)) {
                    notificationService.sendNotification(
                        member.getUser().getId(),
                        String.format("'%s' 그룹이 삭제되었습니다.", group.getTitle())
                    );
                }
            });
        
        travelGroupRepository.delete(group);
        log.info("그룹 삭제: {} by {}", groupId, userId);
    }
    
    public void inviteToGroup(Long groupId, Long inviterId, TravelGroupDto.InviteRequest request) {
        TravelGroup group = travelGroupRepository.findById(groupId)
            .orElseThrow(() -> new TravelGroupException("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        
        User inviter = userRepository.findById(inviterId)
            .orElseThrow(() -> new RuntimeException("초대자를 찾을 수 없습니다."));
        
        User invitee = userRepository.findById(request.getInviteeId())
            .orElseThrow(() -> new RuntimeException("초대받을 사용자를 찾을 수 없습니다."));
        
        // 이미 참여중인지 확인
        if (groupMemberRepository.existsByTravelGroupIdAndUserId(groupId, request.getInviteeId())) {
            throw new RuntimeException("이미 참여중인 사용자입니다.");
        }
        
        // 초대 알림 전송
        String message = String.format("%s님이 '%s' 그룹에 초대했습니다.", inviter.getNickname(), group.getTitle());
        if (request.getMessage() != null && !request.getMessage().isEmpty()) {
            message += " 메시지: " + request.getMessage();
        }
        
        notificationService.sendNotification(request.getInviteeId(), message);
        
        log.info("그룹 초대: Group {} - Inviter {} -> Invitee {}", groupId, inviterId, request.getInviteeId());
    }
    
    @Transactional(readOnly = true)
    public List<TravelGroupDto.MemberResponse> getGroupMembers(Long groupId) {
        TravelGroup group = travelGroupRepository.findById(groupId)
            .orElseThrow(() -> new TravelGroupException("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        
        return group.getMembers().stream()
            .filter(m -> m.getStatus() == GroupMember.Status.ACCEPTED)
            .map(this::convertToMemberResponse)
            .collect(Collectors.toList());
    }
    
    private TravelGroupDto.MemberResponse convertToMemberResponse(GroupMember member) {
        TravelGroupDto.MemberResponse dto = new TravelGroupDto.MemberResponse();
        dto.setId(member.getId());
        dto.setUser(convertUserToDto(member.getUser()));
        dto.setRole(member.getRole().name());
        dto.setStatus(member.getStatus().name());
        dto.setJoinedAt(member.getJoinedAt());
        dto.setIsCreator(member.getRole() == GroupMember.Role.CREATOR);
        return dto;
    }
}