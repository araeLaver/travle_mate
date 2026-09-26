package com.travelmate.service;

import com.travelmate.entity.UploadedFile;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UploadedFileRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FileUploadService 테스트")
class FileUploadServiceTest {

    @Mock
    private UploadedFileRepository uploadedFileRepository;

    @Mock
    private UserRepository userRepository;

    private FileUploadService fileUploadService;

    @TempDir
    Path tempDir;

    private User testUser;

    @BeforeEach
    void setUp() {
        fileUploadService = new FileUploadService(uploadedFileRepository, userRepository);
        ReflectionTestUtils.setField(fileUploadService, "uploadPath", tempDir.toString());
        ReflectionTestUtils.setField(fileUploadService, "maxFileSize", 10485760L); // 10MB
        ReflectionTestUtils.setField(fileUploadService, "uploadDir", tempDir);

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
    }

    @Nested
    @DisplayName("uploadImage 테스트")
    class UploadImageTest {

        @Test
        @DisplayName("성공 - JPG 이미지 업로드")
        void uploadImage_Jpg_Success() throws IOException {
            // Given - JPEG 매직 넘버로 시작하는 파일
            byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", jpegHeader);

            // When
            String result = fileUploadService.uploadImage(file);

            // Then
            assertThat(result).startsWith("/uploads/images/");
            assertThat(result).endsWith(".jpg");
        }

        @Test
        @DisplayName("성공 - PNG 이미지 업로드")
        void uploadImage_Png_Success() throws IOException {
            // Given - PNG 매직 넘버로 시작하는 파일
            byte[] pngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.png", "image/png", pngHeader);

            // When
            String result = fileUploadService.uploadImage(file);

            // Then
            assertThat(result).startsWith("/uploads/images/");
            assertThat(result).endsWith(".png");
        }

        @Test
        @DisplayName("성공 - 사용자 ID와 함께 이미지 업로드")
        void uploadImage_WithUserId_Success() throws IOException {
            // Given
            byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", jpegHeader);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(uploadedFileRepository.save(any(UploadedFile.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            String result = fileUploadService.uploadImage(file, 1L);

            // Then
            assertThat(result).startsWith("/uploads/images/");
            verify(uploadedFileRepository).save(any(UploadedFile.class));
        }

        @Test
        @DisplayName("실패 - 빈 파일")
        void uploadImage_EmptyFile() {
            // Given
            MockMultipartFile emptyFile = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", new byte[0]);

            // When & Then
            assertThatThrownBy(() -> fileUploadService.uploadImage(emptyFile))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("빈 파일");
        }

        @Test
        @DisplayName("실패 - 파일 크기 초과")
        void uploadImage_FileTooLarge() {
            // Given - 11MB 파일
            byte[] largeContent = new byte[11 * 1024 * 1024];
            largeContent[0] = (byte) 0xFF;
            largeContent[1] = (byte) 0xD8;
            largeContent[2] = (byte) 0xFF;

            MockMultipartFile largeFile = new MockMultipartFile(
                    "file", "large.jpg", "image/jpeg", largeContent);

            // When & Then
            assertThatThrownBy(() -> fileUploadService.uploadImage(largeFile))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("크기");
        }

        @Test
        @DisplayName("실패 - 허용되지 않은 확장자")
        void uploadImage_InvalidExtension() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.txt", "text/plain", "test content".getBytes());

            // When & Then
            assertThatThrownBy(() -> fileUploadService.uploadImage(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("허용되지 않은 파일 형식");
        }

        @Test
        @DisplayName("실패 - 위험한 확장자")
        void uploadImage_DangerousExtension() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.exe", "application/octet-stream", "malicious".getBytes());

            // When & Then
            assertThatThrownBy(() -> fileUploadService.uploadImage(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("보안상 허용되지 않는");
        }

        @Test
        @DisplayName("실패 - 경로 탐색 공격 시도")
        void uploadImage_PathTraversal() {
            // Given
            byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "../../../etc/passwd.jpg", "image/jpeg", jpegHeader);

            // When & Then
            assertThatThrownBy(() -> fileUploadService.uploadImage(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("유효하지 않은 파일명");
        }

        @Test
        @DisplayName("실패 - MIME 타입 불일치")
        void uploadImage_MimeTypeMismatch() {
            // Given - jpg 확장자지만 내용이 png 시그니처
            byte[] pngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "fake.jpg", "image/jpeg", pngHeader);

            // When & Then
            assertThatThrownBy(() -> fileUploadService.uploadImage(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("파일 내용이 확장자와 일치하지 않습니다");
        }
    }

    @Nested
    @DisplayName("uploadDocument 테스트")
    class UploadDocumentTest {

        @Test
        @DisplayName("성공 - PDF 문서 업로드")
        void uploadDocument_Pdf_Success() {
            // Given - PDF 매직 넘버로 시작하는 파일
            byte[] pdfHeader = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.pdf", "application/pdf", pdfHeader);

            // When
            String result = fileUploadService.uploadDocument(file);

            // Then
            assertThat(result).startsWith("/uploads/documents/");
            assertThat(result).endsWith(".pdf");
        }

        @Test
        @DisplayName("실패 - 이미지 파일로 문서 업로드 시도")
        void uploadDocument_ImageFile() {
            // Given
            byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", jpegHeader);

            // When & Then
            assertThatThrownBy(() -> fileUploadService.uploadDocument(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("허용되지 않은 파일 형식");
        }
    }

    @Nested
    @DisplayName("uploadProfileImage 테스트")
    class UploadProfileImageTest {

        @Test
        @DisplayName("성공 - 프로필 이미지 업로드")
        void uploadProfileImage_Success() {
            // Given
            byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "profile.jpg", "image/jpeg", jpegHeader);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(uploadedFileRepository.save(any(UploadedFile.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            String result = fileUploadService.uploadProfileImage(file, 1L);

            // Then
            assertThat(result).startsWith("/uploads/profiles/");
            assertThat(result).contains("profile_1_");
        }

        @Test
        @DisplayName("실패 - 프로필 이미지 업로드 사용자 없음")
        void uploadProfileImage_UserNotFound() {
            // Given
            byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
            MockMultipartFile file = new MockMultipartFile(
                    "file", "profile.jpg", "image/jpeg", jpegHeader);

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> fileUploadService.uploadProfileImage(file, 999L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
            verify(uploadedFileRepository, never()).save(any(UploadedFile.class));
        }
    }

    @Nested
    @DisplayName("deleteFile 테스트")
    class DeleteFileTest {

        @Test
        @DisplayName("성공 - 파일 삭제")
        void deleteFile_Success() throws IOException {
            // Given
            Path testFile = tempDir.resolve("images/test.jpg");
            Files.createDirectories(testFile.getParent());
            Files.write(testFile, "test content".getBytes());

            when(uploadedFileRepository.findByFileUrl("/uploads/images/test.jpg"))
                    .thenReturn(Optional.empty());

            // When
            fileUploadService.deleteFile("/uploads/images/test.jpg");

            // Then
            assertThat(Files.exists(testFile)).isFalse();
        }

        @Test
        @DisplayName("성공 - null URL은 무시")
        void deleteFile_NullUrl() {
            // When & Then
            assertThatCode(() -> fileUploadService.deleteFile(null))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("성공 - 빈 URL은 무시")
        void deleteFile_EmptyUrl() {
            // When & Then
            assertThatCode(() -> fileUploadService.deleteFile(""))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("deleteFileWithAuth 테스트")
    class DeleteFileWithAuthTest {

        @Test
        @DisplayName("성공 - 소유자가 파일 삭제")
        void deleteFileWithAuth_Owner_Success() throws IOException {
            // Given
            Path testFile = tempDir.resolve("images/test.jpg");
            Files.createDirectories(testFile.getParent());
            Files.write(testFile, "test content".getBytes());

            UploadedFile uploadedFile = UploadedFile.builder()
                    .user(testUser)
                    .fileUrl("/uploads/images/test.jpg")
                    .build();

            when(uploadedFileRepository.findByFileUrl("/uploads/images/test.jpg"))
                    .thenReturn(Optional.of(uploadedFile));

            // When
            fileUploadService.deleteFileWithAuth("/uploads/images/test.jpg", 1L);

            // Then
            verify(uploadedFileRepository).delete(uploadedFile);
        }

        @Test
        @DisplayName("실패 - 소유자가 아닌 사용자")
        void deleteFileWithAuth_NotOwner() {
            // Given
            UploadedFile uploadedFile = UploadedFile.builder()
                    .user(testUser)
                    .fileUrl("/uploads/images/test.jpg")
                    .build();

            when(uploadedFileRepository.findByFileUrl("/uploads/images/test.jpg"))
                    .thenReturn(Optional.of(uploadedFile));

            // When & Then
            assertThatThrownBy(() -> fileUploadService.deleteFileWithAuth("/uploads/images/test.jpg", 999L))
                    .isInstanceOf(SecurityException.class)
                    .hasMessageContaining("권한이 없습니다");
        }

        @Test
        @DisplayName("실패 - 소유자 정보 없음")
        void deleteFileWithAuth_NoOwnerInfo() {
            // Given
            when(uploadedFileRepository.findByFileUrl("/uploads/images/test.jpg"))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> fileUploadService.deleteFileWithAuth("/uploads/images/test.jpg", 1L))
                    .isInstanceOf(SecurityException.class)
                    .hasMessageContaining("권한을 확인할 수 없습니다");
        }
    }

    @Nested
    @DisplayName("isFileOwner 테스트")
    class IsFileOwnerTest {

        @Test
        @DisplayName("성공 - 소유자 확인")
        void isFileOwner_True() {
            // Given
            when(uploadedFileRepository.existsByFileUrlAndUserId("/uploads/images/test.jpg", 1L))
                    .thenReturn(true);

            // When
            boolean result = fileUploadService.isFileOwner("/uploads/images/test.jpg", 1L);

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("실패 - 소유자 아님")
        void isFileOwner_False() {
            // Given
            when(uploadedFileRepository.existsByFileUrlAndUserId("/uploads/images/test.jpg", 2L))
                    .thenReturn(false);

            // When
            boolean result = fileUploadService.isFileOwner("/uploads/images/test.jpg", 2L);

            // Then
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("isValidImageUrl 테스트")
    class IsValidImageUrlTest {

        @Test
        @DisplayName("성공 - HTTP URL")
        void isValidImageUrl_HttpUrl() {
            // When
            boolean result = fileUploadService.isValidImageUrl("http://example.com/image.jpg");

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("성공 - HTTPS URL")
        void isValidImageUrl_HttpsUrl() {
            // When
            boolean result = fileUploadService.isValidImageUrl("https://example.com/image.jpg");

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("성공 - 로컬 업로드 파일 존재")
        void isValidImageUrl_LocalFileExists() throws IOException {
            // Given
            Path testFile = tempDir.resolve("images/test.jpg");
            Files.createDirectories(testFile.getParent());
            Files.write(testFile, "test content".getBytes());

            // When
            boolean result = fileUploadService.isValidImageUrl("/uploads/images/test.jpg");

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("실패 - null URL")
        void isValidImageUrl_NullUrl() {
            // When
            boolean result = fileUploadService.isValidImageUrl(null);

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("실패 - 빈 URL")
        void isValidImageUrl_EmptyUrl() {
            // When
            boolean result = fileUploadService.isValidImageUrl("");

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("실패 - 경로 탐색 시도")
        void isValidImageUrl_PathTraversal() {
            // When
            boolean result = fileUploadService.isValidImageUrl("/uploads/../../../etc/passwd");

            // Then
            assertThat(result).isFalse();
        }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
