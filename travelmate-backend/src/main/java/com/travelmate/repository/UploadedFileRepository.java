package com.travelmate.repository;

import com.travelmate.entity.UploadedFile;
import com.travelmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UploadedFileRepository extends JpaRepository<UploadedFile, Long> {

    Optional<UploadedFile> findByFileUrl(String fileUrl);

    List<UploadedFile> findByUser(User user);

    boolean existsByFileUrlAndUserId(String fileUrl, Long userId);

    void deleteByFileUrl(String fileUrl);
}
