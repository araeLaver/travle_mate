package com.travelmate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 이미지 처리 서비스
 * - 이미지 업로드
 * - 썸네일 생성
 * - 이미지 리사이징
 * - 이미지 압축
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImageProcessingService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private static final int THUMBNAIL_WIDTH = 200;
    private static final int THUMBNAIL_HEIGHT = 200;
    private static final int MAX_WIDTH = 1920;
    private static final int MAX_HEIGHT = 1080;
    private static final float COMPRESSION_QUALITY = 0.85f;

    /**
     * 이미지 업로드 및 처리
     * @param file 업로드할 파일
     * @param subfolder 저장할 하위 폴더 (profile, post, group 등)
     * @return 저장된 파일 정보
     */
    public ImageUploadResult uploadImage(MultipartFile file, String subfolder) throws IOException {
        // 1. 파일 검증
        validateImage(file);

        // 2. 원본 이미지 저장
        String originalFileName = file.getOriginalFilename();
        String extension = getFileExtension(originalFileName);
        String uniqueFileName = generateUniqueFileName(extension);

        Path uploadPath = Paths.get(uploadDir, subfolder);
        Files.createDirectories(uploadPath);

        Path originalPath = uploadPath.resolve(uniqueFileName);
        BufferedImage originalImage = ImageIO.read(file.getInputStream());

        // 3. 이미지 리사이징 (너무 크면)
        BufferedImage resizedImage = resizeImageIfNeeded(originalImage, MAX_WIDTH, MAX_HEIGHT);

        // 4. 이미지 압축 및 저장
        saveCompressedImage(resizedImage, originalPath.toFile(), extension);

        // 5. 썸네일 생성
        String thumbnailFileName = "thumb_" + uniqueFileName;
        Path thumbnailPath = uploadPath.resolve(thumbnailFileName);
        BufferedImage thumbnail = createThumbnail(resizedImage, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        saveCompressedImage(thumbnail, thumbnailPath.toFile(), extension);

        log.info("Image uploaded successfully: {} (thumbnail: {})", uniqueFileName, thumbnailFileName);

        return ImageUploadResult.builder()
                .originalUrl(String.format("/uploads/%s/%s", subfolder, uniqueFileName))
                .thumbnailUrl(String.format("/uploads/%s/%s", subfolder, thumbnailFileName))
                .originalFileName(originalFileName)
                .savedFileName(uniqueFileName)
                .fileSize(Files.size(originalPath))
                .width(resizedImage.getWidth())
                .height(resizedImage.getHeight())
                .contentType(file.getContentType())
                .build();
    }

    /**
     * 파일 검증
     */
    private void validateImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 10MB");
        }

        String extension = getFileExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file extension. Allowed: " + ALLOWED_EXTENSIONS);
        }

        // Content-Type 검증
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Invalid content type");
        }
    }

    /**
     * 이미지 리사이징 (필요한 경우에만)
     */
    private BufferedImage resizeImageIfNeeded(BufferedImage original, int maxWidth, int maxHeight) {
        int width = original.getWidth();
        int height = original.getHeight();

        if (width <= maxWidth && height <= maxHeight) {
            return original;
        }

        // 비율 유지하면서 리사이징
        double widthRatio = (double) maxWidth / width;
        double heightRatio = (double) maxHeight / height;
        double ratio = Math.min(widthRatio, heightRatio);

        int newWidth = (int) (width * ratio);
        int newHeight = (int) (height * ratio);

        return resizeImage(original, newWidth, newHeight);
    }

    /**
     * 이미지 리사이징
     */
    private BufferedImage resizeImage(BufferedImage original, int targetWidth, int targetHeight) {
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = resized.createGraphics();

        // 고품질 리사이징 설정
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        graphics.drawImage(original, 0, 0, targetWidth, targetHeight, null);
        graphics.dispose();

        return resized;
    }

    /**
     * 썸네일 생성 (정사각형 크롭)
     */
    private BufferedImage createThumbnail(BufferedImage original, int size) {
        return createThumbnail(original, size, size);
    }

    /**
     * 썸네일 생성
     */
    private BufferedImage createThumbnail(BufferedImage original, int width, int height) {
        int originalWidth = original.getWidth();
        int originalHeight = original.getHeight();

        // 중앙 크롭
        int cropSize = Math.min(originalWidth, originalHeight);
        int x = (originalWidth - cropSize) / 2;
        int y = (originalHeight - cropSize) / 2;

        BufferedImage cropped = original.getSubimage(x, y, cropSize, cropSize);
        return resizeImage(cropped, width, height);
    }

    /**
     * 압축된 이미지 저장
     */
    private void saveCompressedImage(BufferedImage image, File outputFile, String extension) throws IOException {
        String format = extension.equalsIgnoreCase("jpg") ? "jpeg" : extension;
        ImageIO.write(image, format, outputFile);
    }

    /**
     * 파일 삭제
     */
    public void deleteImage(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            Files.deleteIfExists(path);

            // 썸네일도 삭제
            String thumbnailPath = filePath.replace(Paths.get(filePath).getFileName().toString(),
                    "thumb_" + Paths.get(filePath).getFileName().toString());
            Files.deleteIfExists(Paths.get(uploadDir, thumbnailPath));

            log.info("Image deleted: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete image: {}", filePath, e);
        }
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    /**
     * 고유한 파일명 생성
     */
    private String generateUniqueFileName(String extension) {
        return UUID.randomUUID().toString() + "." + extension;
    }

    /**
     * 이미지 업로드 결과
     */
    @lombok.Builder
    @lombok.Getter
    public static class ImageUploadResult {
        private String originalUrl;      // 원본 이미지 URL
        private String thumbnailUrl;     // 썸네일 URL
        private String originalFileName; // 원본 파일명
        private String savedFileName;    // 저장된 파일명
        private long fileSize;           // 파일 크기 (bytes)
        private int width;               // 이미지 너비
        private int height;              // 이미지 높이
        private String contentType;      // Content-Type
    }
}
