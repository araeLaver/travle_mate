package com.travelmate.repository;

import com.travelmate.entity.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    /**
     * 사용자의 모든 북마크 조회
     */
    @Query("SELECT b FROM Bookmark b WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    Page<Bookmark> findByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * 사용자의 타입별 북마크 조회
     */
    @Query("SELECT b FROM Bookmark b WHERE b.user.id = :userId AND b.targetType = :targetType ORDER BY b.createdAt DESC")
    Page<Bookmark> findByUserIdAndTargetType(@Param("userId") Long userId,
                                              @Param("targetType") Bookmark.TargetType targetType,
                                              Pageable pageable);

    /**
     * 사용자의 폴더별 북마크 조회
     */
    @Query("SELECT b FROM Bookmark b WHERE b.user.id = :userId AND b.folderName = :folderName ORDER BY b.createdAt DESC")
    Page<Bookmark> findByUserIdAndFolderName(@Param("userId") Long userId,
                                              @Param("folderName") String folderName,
                                              Pageable pageable);

    /**
     * 특정 대상의 북마크 조회
     */
    Optional<Bookmark> findByUserIdAndTargetTypeAndTargetId(Long userId,
                                                            Bookmark.TargetType targetType,
                                                            Long targetId);

    /**
     * 북마크 여부 확인
     */
    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId,
                                                   Bookmark.TargetType targetType,
                                                   Long targetId);

    /**
     * 북마크 삭제
     */
    @Modifying
    @Query("DELETE FROM Bookmark b WHERE b.user.id = :userId AND b.targetType = :targetType AND b.targetId = :targetId")
    int deleteByUserIdAndTarget(@Param("userId") Long userId,
                                @Param("targetType") Bookmark.TargetType targetType,
                                @Param("targetId") Long targetId);

    /**
     * 사용자의 폴더 목록 조회
     */
    @Query("SELECT DISTINCT b.folderName FROM Bookmark b WHERE b.user.id = :userId AND b.folderName IS NOT NULL ORDER BY b.folderName")
    List<String> findDistinctFoldersByUserId(@Param("userId") Long userId);

    /**
     * 타입별 북마크 수
     */
    @Query("SELECT b.targetType, COUNT(b) FROM Bookmark b WHERE b.user.id = :userId GROUP BY b.targetType")
    List<Object[]> countByUserIdGroupByType(@Param("userId") Long userId);

    /**
     * 특정 대상의 북마크 수 (인기도 측정용)
     */
    long countByTargetTypeAndTargetId(Bookmark.TargetType targetType, Long targetId);

    /**
     * 여러 대상의 북마크 여부 일괄 조회
     */
    @Query("SELECT b.targetId FROM Bookmark b WHERE b.user.id = :userId AND b.targetType = :targetType AND b.targetId IN :targetIds")
    List<Long> findBookmarkedTargetIds(@Param("userId") Long userId,
                                       @Param("targetType") Bookmark.TargetType targetType,
                                       @Param("targetIds") List<Long> targetIds);

    /**
     * 폴더명 일괄 변경
     */
    @Modifying
    @Query("UPDATE Bookmark b SET b.folderName = :newFolderName WHERE b.user.id = :userId AND b.folderName = :oldFolderName")
    int updateFolderName(@Param("userId") Long userId,
                         @Param("oldFolderName") String oldFolderName,
                         @Param("newFolderName") String newFolderName);

    /**
     * 사용자의 전체 북마크 수
     */
    long countByUserId(Long userId);
}
