package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.entity.EmergencyContact;
import com.travelmate.service.EmergencyContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/safety/emergency-contacts")
@RequiredArgsConstructor
@Tag(name = "Safety", description = "안전 관련 API")
public class EmergencyContactController {

    private final EmergencyContactService emergencyContactService;

    @GetMapping
    @Operation(summary = "긴급 연락처 목록", description = "내 긴급 연락처 목록을 조회합니다.")
    public ResponseEntity<List<ContactResponse>> getContacts(
            @AuthenticationPrincipal String userId) {
        List<EmergencyContact> contacts = emergencyContactService.getContacts(AuthenticatedUserId.parse(userId));
        List<ContactResponse> response = contacts.stream().map(ContactResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "긴급 연락처 추가", description = "긴급 연락처를 추가합니다. (최대 5개)")
    public ResponseEntity<ContactResponse> addContact(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ContactRequest request) {
        EmergencyContact contact = emergencyContactService.addContact(
                AuthenticatedUserId.parse(userId),
                request.getName(),
                request.getRelationship(),
                request.getPhoneNumber(),
                request.getEmail()
        );
        return ResponseEntity.ok(ContactResponse.from(contact));
    }

    @PutMapping("/{contactId}")
    @Operation(summary = "긴급 연락처 수정", description = "긴급 연락처를 수정합니다.")
    public ResponseEntity<ContactResponse> updateContact(
            @AuthenticationPrincipal String userId,
            @PathVariable Long contactId,
            @Valid @RequestBody ContactRequest request) {
        EmergencyContact contact = emergencyContactService.updateContact(
                AuthenticatedUserId.parse(userId),
                contactId,
                request.getName(),
                request.getRelationship(),
                request.getPhoneNumber(),
                request.getEmail()
        );
        return ResponseEntity.ok(ContactResponse.from(contact));
    }

    @DeleteMapping("/{contactId}")
    @Operation(summary = "긴급 연락처 삭제", description = "긴급 연락처를 삭제합니다.")
    public ResponseEntity<Void> deleteContact(
            @AuthenticationPrincipal String userId,
            @PathVariable Long contactId) {
        emergencyContactService.deleteContact(AuthenticatedUserId.parse(userId), contactId);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class ContactRequest {
        @NotBlank(message = "이름은 필수입니다")
        @Size(max = 100)
        private String name;

        @NotBlank(message = "관계는 필수입니다")
        @Size(max = 50)
        private String relationship;

        @NotBlank(message = "전화번호는 필수입니다")
        @Size(max = 20)
        private String phoneNumber;

        @Size(max = 255)
        private String email;
    }

    @Data
    public static class ContactResponse {
        private Long id;
        private String name;
        private String relationship;
        private String phoneNumber;
        private String email;
        private Integer sortOrder;

        public static ContactResponse from(EmergencyContact contact) {
            ContactResponse r = new ContactResponse();
            r.id = contact.getId();
            r.name = contact.getName();
            r.relationship = contact.getRelationship();
            r.phoneNumber = contact.getPhoneNumber();
            r.email = contact.getEmail();
            r.sortOrder = contact.getSortOrder();
            return r;
        }
    }
}
