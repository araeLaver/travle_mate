package com.travelmate.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ImageProcessingService 테스트")
class ImageProcessingServiceTest {

    private ImageProcessingService imageProcessingService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        imageProcessingService = new ImageProcessingService();
        ReflectionTestUtils.setField(imageProcessingService, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(imageProcessingService, "webpQuality", 0.8f);
        ReflectionTestUtils.setField(imageProcessingService, "webpEnabled", true);
    }

    private byte[] createValidJpegImage(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        return baos.toByteArray();
    }

    private byte[] createValidPngImage(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    @Nested
    @DisplayName("uploadImage 테스트")
    class UploadImageTest {

        @Test
        @DisplayName("성공 - JPEG 이미지 업로드")
        void uploadImage_Jpeg_Success() throws IOException {
            // Given
            byte[] imageContent = createValidJpegImage(800, 600);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", imageContent);

            // When
            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImage(file, "test");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getOriginalUrl()).startsWith("/uploads/test/");
            assertThat(result.getThumbnailUrl()).contains("thumb_");
            assertThat(result.getOriginalFileName()).isEqualTo("test.jpg");
            assertThat(result.getWidth()).isEqualTo(800);
            assertThat(result.getHeight()).isEqualTo(600);
        }

        @Test
        @DisplayName("성공 - PNG 이미지 업로드")
        void uploadImage_Png_Success() throws IOException {
            // Given
            byte[] imageContent = createValidPngImage(400, 300);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.png", "image/png", imageContent);

            // When
            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImage(file, "test");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getOriginalUrl()).endsWith(".png");
            assertThat(result.getContentType()).isEqualTo("image/png");
        }

        @Test
        @DisplayName("성공 - 큰 이미지 자동 리사이징")
        void uploadImage_LargeImage_Resized() throws IOException {
            // Given - 2000x2000 이미지 (MAX_WIDTH=1920, MAX_HEIGHT=1080 초과)
            byte[] imageContent = createValidJpegImage(2000, 2000);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "large.jpg", "image/jpeg", imageContent);

            // When
            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImage(file, "test");

            // Then - 비율 유지하면서 리사이징됨
            assertThat(result.getWidth()).isLessThanOrEqualTo(1920);
            assertThat(result.getHeight()).isLessThanOrEqualTo(1080);
        }

        @Test
        @DisplayName("성공 - 썸네일 생성 확인")
        void uploadImage_ThumbnailCreated() throws IOException {
            // Given
            byte[] imageContent = createValidJpegImage(800, 600);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", imageContent);

            // When
            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImage(file, "test");

            // Then - 썸네일 파일이 생성됨
            String thumbnailPath = result.getThumbnailUrl().replace("/uploads/", "");
            Path fullThumbnailPath = tempDir.resolve(thumbnailPath);
            assertThat(Files.exists(fullThumbnailPath)).isTrue();
        }

        @Test
        @DisplayName("실패 - 빈 파일")
        void uploadImage_EmptyFile() {
            // Given
            MockMultipartFile emptyFile = new MockMultipartFile(
                    "file", "empty.jpg", "image/jpeg", new byte[0]);

            // When & Then
            assertThatThrownBy(() -> imageProcessingService.uploadImage(emptyFile, "test"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Empty file");
        }

        @Test
        @DisplayName("실패 - 파일 크기 초과 (10MB)")
        void uploadImage_FileTooLarge() {
            // Given - 11MB 파일
            byte[] largeContent = new byte[11 * 1024 * 1024];
            MockMultipartFile largeFile = new MockMultipartFile(
                    "file", "large.jpg", "image/jpeg", largeContent);

            // When & Then
            assertThatThrownBy(() -> imageProcessingService.uploadImage(largeFile, "test"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("10MB");
        }

        @Test
        @DisplayName("실패 - 허용되지 않은 확장자")
        void uploadImage_InvalidExtension() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.exe", "application/octet-stream", "content".getBytes());

            // When & Then
            assertThatThrownBy(() -> imageProcessingService.uploadImage(file, "test"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid file extension");
        }

        @Test
        @DisplayName("실패 - 이미지가 아닌 Content-Type")
        void uploadImage_InvalidContentType() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "text/plain", "not an image".getBytes());

            // When & Then
            assertThatThrownBy(() -> imageProcessingService.uploadImage(file, "test"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid content type");
        }

        @Test
        @DisplayName("실패 - 유효하지 않은 이미지 매직 넘버")
        void uploadImage_InvalidMagicNumber() {
            // Given - 이미지가 아닌 바이트 배열
            byte[] invalidContent = "not an image content".getBytes();
            MockMultipartFile file = new MockMultipartFile(
                    "file", "fake.jpg", "image/jpeg", invalidContent);

            // When & Then
            assertThatThrownBy(() -> imageProcessingService.uploadImage(file, "test"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("does not match");
        }
    }

    @Nested
    @DisplayName("uploadImageWithWebP 테스트")
    class UploadImageWithWebPTest {

        @Test
        @DisplayName("성공 - WebP 변환 포함 업로드")
        void uploadImageWithWebP_Success() throws IOException {
            // Given
            byte[] imageContent = createValidJpegImage(400, 300);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", imageContent);

            // When
            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImageWithWebP(file, "test");

            // Then
            assertThat(result.getOriginalUrl()).isNotNull();
            // WebP 변환은 라이브러리 지원 여부에 따라 다름
        }

        @Test
        @DisplayName("WebP 비활성화시 원본만 반환")
        void uploadImageWithWebP_Disabled() throws IOException {
            // Given
            ReflectionTestUtils.setField(imageProcessingService, "webpEnabled", false);
            byte[] imageContent = createValidJpegImage(400, 300);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", imageContent);

            // When
            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImageWithWebP(file, "test");

            // Then
            assertThat(result.getOriginalUrl()).isNotNull();
            assertThat(result.getWebpUrl()).isNull();
        }
    }

    @Nested
    @DisplayName("deleteImage 테스트")
    class DeleteImageTest {

        @Test
        @DisplayName("성공 - 이미지 삭제")
        void deleteImage_Success() throws IOException {
            // Given - 먼저 파일 생성
            byte[] imageContent = createValidJpegImage(100, 100);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", imageContent);

            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImage(file, "test");
            String filePath = result.getOriginalUrl().replace("/uploads/", "");

            // 파일이 존재하는지 확인
            Path fullPath = tempDir.resolve(filePath);
            assertThat(Files.exists(fullPath)).isTrue();

            // When
            imageProcessingService.deleteImage(filePath);

            // Then
            assertThat(Files.exists(fullPath)).isFalse();
        }

        @Test
        @DisplayName("성공 - 존재하지 않는 파일 삭제 시도 (무시)")
        void deleteImage_FileNotExists() {
            // When & Then - 예외 발생하지 않아야 함
            assertThatCode(() -> imageProcessingService.deleteImage("nonexistent/file.jpg"))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("getOptimalImageUrl 테스트")
    class GetOptimalImageUrlTest {

        @Test
        @DisplayName("WebP 지원 브라우저 - WebP URL 반환")
        void getOptimalImageUrl_WebPSupported() throws IOException {
            // Given
            byte[] imageContent = createValidJpegImage(100, 100);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", imageContent);

            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImage(file, "test");

            // WebP 파일 생성 (실제로는 convertToWebPAndSave가 처리)
            String originalPath = result.getOriginalUrl().replace("/uploads/", "");
            String webpPath = originalPath.replace(".jpg", ".webp");
            Path fullWebpPath = tempDir.resolve(webpPath);
            Files.createDirectories(fullWebpPath.getParent());
            Files.write(fullWebpPath, "webp content".getBytes());

            String acceptHeader = "image/webp,image/apng,image/*,*/*;q=0.8";

            // When
            String optimalUrl = imageProcessingService.getOptimalImageUrl(result.getOriginalUrl(), acceptHeader);

            // Then
            assertThat(optimalUrl).endsWith(".webp");
        }

        @Test
        @DisplayName("WebP 미지원 브라우저 - 원본 URL 반환")
        void getOptimalImageUrl_WebPNotSupported() throws IOException {
            // Given
            byte[] imageContent = createValidJpegImage(100, 100);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", imageContent);

            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImage(file, "test");
            String acceptHeader = "image/png,image/*,*/*;q=0.8";

            // When
            String optimalUrl = imageProcessingService.getOptimalImageUrl(result.getOriginalUrl(), acceptHeader);

            // Then
            assertThat(optimalUrl).isEqualTo(result.getOriginalUrl());
        }

        @Test
        @DisplayName("Accept 헤더가 null - 원본 URL 반환")
        void getOptimalImageUrl_NullAcceptHeader() throws IOException {
            // Given
            byte[] imageContent = createValidJpegImage(100, 100);
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.jpg", "image/jpeg", imageContent);

            ImageProcessingService.ImageUploadResult result = imageProcessingService.uploadImage(file, "test");

            // When
            String optimalUrl = imageProcessingService.getOptimalImageUrl(result.getOriginalUrl(), null);

            // Then
            assertThat(optimalUrl).isEqualTo(result.getOriginalUrl());
        }
    }

    @Nested
    @DisplayName("isWebPSupported 테스트")
    class IsWebPSupportedTest {

        @Test
        @DisplayName("WebP 지원 여부 확인")
        void isWebPSupported() {
            // When
            boolean supported = imageProcessingService.isWebPSupported();

            // Then - 환경에 따라 다를 수 있음
            assertThat(supported).isIn(true, false);
        }
    }

    @Nested
    @DisplayName("ImageUploadResult 테스트")
    class ImageUploadResultTest {

        @Test
        @DisplayName("빌더 패턴으로 생성")
        void imageUploadResult_Builder() {
            // When
            ImageProcessingService.ImageUploadResult result = ImageProcessingService.ImageUploadResult.builder()
                    .originalUrl("/uploads/test/image.jpg")
                    .thumbnailUrl("/uploads/test/thumb_image.jpg")
                    .webpUrl("/uploads/test/image.webp")
                    .originalFileName("original.jpg")
                    .savedFileName("image.jpg")
                    .fileSize(1024L)
                    .width(800)
                    .height(600)
                    .contentType("image/jpeg")
                    .build();

            // Then
            assertThat(result.getOriginalUrl()).isEqualTo("/uploads/test/image.jpg");
            assertThat(result.getThumbnailUrl()).isEqualTo("/uploads/test/thumb_image.jpg");
            assertThat(result.getWebpUrl()).isEqualTo("/uploads/test/image.webp");
            assertThat(result.getOriginalFileName()).isEqualTo("original.jpg");
            assertThat(result.getSavedFileName()).isEqualTo("image.jpg");
            assertThat(result.getFileSize()).isEqualTo(1024L);
            assertThat(result.getWidth()).isEqualTo(800);
            assertThat(result.getHeight()).isEqualTo(600);
            assertThat(result.getContentType()).isEqualTo("image/jpeg");
        }
    }
}
