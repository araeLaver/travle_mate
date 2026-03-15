package com.travelmate.repository;

import com.travelmate.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {

    List<EmergencyContact> findByUserIdOrderBySortOrderAsc(Long userId);

    long countByUserId(Long userId);
}
