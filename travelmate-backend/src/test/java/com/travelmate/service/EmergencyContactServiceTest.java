package com.travelmate.service;

import com.travelmate.entity.EmergencyContact;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.EmergencyContactRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmergencyContactService 테스트")
class EmergencyContactServiceTest {

    @Mock private EmergencyContactRepository emergencyContactRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private EmergencyContactService emergencyContactService;

    private User user;
    private EmergencyContact contact;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setNickname("User");

        contact = new EmergencyContact();
        contact.setId(10L);
        contact.setUser(user);
        contact.setName("Kim");
        contact.setRelationship("friend");
        contact.setPhoneNumber("01012345678");
    }

    @Nested
    @DisplayName("addContact")
    class AddContact {

        @Test
        @DisplayName("성공 - 긴급 연락처 추가")
        void success() {
            when(emergencyContactRepository.countByUserId(1L)).thenReturn(0L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(emergencyContactRepository.save(any(EmergencyContact.class))).thenAnswer(invocation -> invocation.getArgument(0));

            EmergencyContact result = emergencyContactService.addContact(
                    1L, "Kim", "friend", "01012345678", "kim@test.com");

            assertThat(result.getUser()).isEqualTo(user);
            assertThat(result.getSortOrder()).isZero();
        }

        @Test
        @DisplayName("실패 - 최대 개수 초과는 400")
        void failMaxContacts() {
            when(emergencyContactRepository.countByUserId(1L)).thenReturn(5L);

            assertThatThrownBy(() -> emergencyContactService.addContact(
                    1L, "Kim", "friend", "01012345678", null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("최대 5개")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 사용자 없음은 404")
        void failUserNotFound() {
            when(emergencyContactRepository.countByUserId(1L)).thenReturn(0L);
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> emergencyContactService.addContact(
                    1L, "Kim", "friend", "01012345678", null))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("update/delete")
    class UpdateDelete {

        @Test
        @DisplayName("없는 연락처 수정은 404")
        void updateNotFound() {
            when(emergencyContactRepository.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> emergencyContactService.updateContact(
                    1L, 10L, "Kim", "friend", "01012345678", null))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }

        @Test
        @DisplayName("다른 사용자 연락처 삭제는 403")
        void deleteForbidden() {
            when(emergencyContactRepository.findById(10L)).thenReturn(Optional.of(contact));

            assertThatThrownBy(() -> emergencyContactService.deleteContact(2L, 10L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
