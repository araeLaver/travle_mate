package com.travelmate.repository;

import com.travelmate.entity.UserGroupMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

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
     * 여러 그룹의 멤버십을 한 번에 조회 (N+1 방지)
     */
    @Query("SELECT m FROM UserGroupMembership m " +
           "LEFT JOIN FETCH m.user " +
           "WHERE m.travelGroup.id IN :groupIds " +
           "AND m.status = 'ACCEPTED'")
    List<UserGroupMembership> findByTravelGroupIdInWithUser(@Param("groupIds") Set<Long> groupIds);

    /**
     * 사용자가 가입한 그룹 ID 목록 조회 (배치 조회용)
     */
    @Query("SELECT m.travelGroup.id FROM UserGroupMembership m " +
           "WHERE m.user.id = :userId AND m.status = 'ACCEPTED'")
    Set<Long> findJoinedGroupIdsByUserId(@Param("userId") Long userId);

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
