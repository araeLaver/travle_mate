package com.travelmate.service;

import com.travelmate.entity.EmergencyContact;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.EmergencyContactRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class EmergencyContactService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final UserRepository userRepository;

    private static final int MAX_CONTACTS = 5;

    @Transactional(readOnly = true)
    public List<EmergencyContact> getContacts(Long userId) {
        return emergencyContactRepository.findByUserIdOrderBySortOrderAsc(userId);
    }

    public EmergencyContact addContact(Long userId, String name, String relationship,
                                        String phoneNumber, String email) {
        long count = emergencyContactRepository.countByUserId(userId);
        if (count >= MAX_CONTACTS) {
            throw new BusinessException("긴급 연락처는 최대 " + MAX_CONTACTS + "개까지 등록할 수 있습니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        EmergencyContact contact = new EmergencyContact();
        contact.setUser(user);
        contact.setName(name);
        contact.setRelationship(relationship);
        contact.setPhoneNumber(phoneNumber);
        contact.setEmail(email);
        contact.setSortOrder((int) count);

        contact = emergencyContactRepository.save(contact);
        log.info("긴급 연락처 추가: userId={}, contactId={}", userId, contact.getId());
        return contact;
    }

    public EmergencyContact updateContact(Long userId, Long contactId, String name,
                                           String relationship, String phoneNumber, String email) {
        EmergencyContact contact = emergencyContactRepository.findById(contactId)
                .orElseThrow(() -> BusinessException.notFound("긴급 연락처를 찾을 수 없습니다."));

        if (!contact.getUser().getId().equals(userId)) {
            throw BusinessException.forbidden("수정 권한이 없습니다.");
        }

        contact.setName(name);
        contact.setRelationship(relationship);
        contact.setPhoneNumber(phoneNumber);
        contact.setEmail(email);

        contact = emergencyContactRepository.save(contact);
        log.info("긴급 연락처 수정: userId={}, contactId={}", userId, contactId);
        return contact;
    }

    public void deleteContact(Long userId, Long contactId) {
        EmergencyContact contact = emergencyContactRepository.findById(contactId)
                .orElseThrow(() -> BusinessException.notFound("긴급 연락처를 찾을 수 없습니다."));

        if (!contact.getUser().getId().equals(userId)) {
            throw BusinessException.forbidden("삭제 권한이 없습니다.");
        }

        emergencyContactRepository.delete(contact);
        log.info("긴급 연락처 삭제: userId={}, contactId={}", userId, contactId);
    }
}
