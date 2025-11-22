package com.travelmate.repository;

import com.travelmate.entity.UserGroupMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 사용자-그룹 멤버십 레포지토리
 */
@Repository
public interface UserGroupMembershipRepository extends JpaRepository<UserGroupMembership, Long> {

    /**
     * 사용자 ID로 멤버십 조회
     */
    List<UserGroupMembership> findByUserId(Long userId);

    /**
     * 그룹 ID로 멤버십 조회
     */
    List<UserGroupMembership> findByTravelGroupId(Long travelGroupId);

    /**
     * 사용자 ID와 그룹 ID로 멤버십 조회
     */
    Optional<UserGroupMembership> findByUserIdAndTravelGroupId(Long userId, Long travelGroupId);

    /**
     * 사용자 ID와 상태로 멤버십 조회
     */
    List<UserGroupMembership> findByUserIdAndStatus(Long userId, UserGroupMembership.MembershipStatus status);

    /**
     * 그룹 ID와 상태로 멤버십 조회
     */
    List<UserGroupMembership> findByTravelGroupIdAndStatus(Long travelGroupId, UserGroupMembership.MembershipStatus status);

    /**
     * 사용자가 특정 그룹의 멤버인지 확인
     */
    boolean existsByUserIdAndTravelGroupIdAndStatus(Long userId, Long travelGroupId, UserGroupMembership.MembershipStatus status);
}
