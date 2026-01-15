package com.travelmate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
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
import java.util.Iterator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.springframework.scheduling.annotation.Async;

/**
 * 이미지 처리 서비스
 * - 이미지 업로드
 * - 썸네일 생성
 * - 이미지 리사이징
 * - 이미지 압축
 * - WebP 변환
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

    // 이미지 파일 매직 넘버 (파일 시그니처)
    private static final byte[] JPEG_MAGIC = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] GIF_MAGIC_87 = {0x47, 0x49, 0x46, 0x38, 0x37, 0x61}; // GIF87a
    private static final byte[] GIF_MAGIC_89 = {0x47, 0x49, 0x46, 0x38, 0x39, 0x61}; // GIF89a
    private static final byte[] WEBP_MAGIC = {0x52, 0x49, 0x46, 0x46}; // RIFF (WebP starts with RIFF)
    private static final byte[] WEBP_SIGNATURE = {0x57, 0x45, 0x42, 0x50}; // WEBP at offset 8

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

        // SECURITY: 매직 넘버 검증 (파일 확장자 스푸핑 방지)
        try {
            if (!validateMagicNumber(file)) {
                log.warn("File magic number validation failed for: {}", file.getOriginalFilename());
                throw new IllegalArgumentException("File content does not match declared type");
            }
        } catch (IOException e) {
            log.error("Failed to read file for magic number validation", e);
            throw new IllegalArgumentException("Failed to validate file content");
        }
    }

    /**
     * 매직 넘버(파일 시그니처) 검증
     * 파일 확장자와 실제 파일 내용이 일치하는지 확인
     */
    private boolean validateMagicNumber(MultipartFile file) throws IOException {
        byte[] header = new byte[12];
        int bytesRead = file.getInputStream().read(header);

        if (bytesRead < 3) {
            return false;
        }

        // JPEG 검증
        if (startsWith(header, JPEG_MAGIC)) {
            return true;
        }

        // PNG 검증
        if (bytesRead >= 8 && startsWith(header, PNG_MAGIC)) {
            return true;
        }

        // GIF 검증
        if (bytesRead >= 6 && (startsWith(header, GIF_MAGIC_87) || startsWith(header, GIF_MAGIC_89))) {
            return true;
        }

        // WebP 검증 (RIFF....WEBP)
        if (bytesRead >= 12 && startsWith(header, WEBP_MAGIC)) {
            byte[] webpCheck = new byte[4];
            System.arraycopy(header, 8, webpCheck, 0, 4);
            if (startsWith(webpCheck, WEBP_SIGNATURE)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 바이트 배열이 특정 시그니처로 시작하는지 확인
     */
    private boolean startsWith(byte[] data, byte[] signature) {
        if (data.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (data[i] != signature[i]) {
                return false;
            }
        }
        return true;
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
        private String webpUrl;          // WebP 이미지 URL
        private String thumbnailWebpUrl; // WebP 썸네일 URL
        private String originalFileName; // 원본 파일명
        private String savedFileName;    // 저장된 파일명
        private long fileSize;           // 파일 크기 (bytes)
        private int width;               // 이미지 너비
        private int height;              // 이미지 높이
        private String contentType;      // Content-Type
    }

    // ================== WebP 변환 기능 ==================

    @Value("${image.processing.webp.quality:0.8}")
    private float webpQuality = 0.8f;

    @Value("${image.processing.webp.enabled:true}")
    private boolean webpEnabled = true;

    /**
     * 이미지 업로드 및 WebP 변환
     */
    public ImageUploadResult uploadImageWithWebP(MultipartFile file, String subfolder) throws IOException {
        // 기본 이미지 업로드
        ImageUploadResult result = uploadImage(file, subfolder);

        if (!webpEnabled) {
            return result;
        }

        // WebP 변환
        String webpUrl = convertToWebPAndSave(result.getSavedFileName(), subfolder);
        String thumbnailWebpUrl = convertToWebPAndSave("thumb_" + result.getSavedFileName(), subfolder);

        return ImageUploadResult.builder()
                .originalUrl(result.getOriginalUrl())
                .thumbnailUrl(result.getThumbnailUrl())
                .webpUrl(webpUrl)
                .thumbnailWebpUrl(thumbnailWebpUrl)
                .originalFileName(result.getOriginalFileName())
                .savedFileName(result.getSavedFileName())
                .fileSize(result.getFileSize())
                .width(result.getWidth())
                .height(result.getHeight())
                .contentType(result.getContentType())
                .build();
    }

    /**
     * 기존 이미지를 WebP로 변환 (비동기)
     */
    @Async
    public CompletableFuture<String> convertToWebPAsync(String imagePath, String subfolder) {
        try {
            String webpUrl = convertToWebPAndSave(imagePath, subfolder);
            return CompletableFuture.completedFuture(webpUrl);
        } catch (IOException e) {
            log.error("WebP conversion failed for: {}", imagePath, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * WebP로 변환 후 저장
     */
    private String convertToWebPAndSave(String fileName, String subfolder) throws IOException {
        Path originalPath = Paths.get(uploadDir, subfolder, fileName);
        if (!Files.exists(originalPath)) {
            throw new IOException("Original file not found: " + originalPath);
        }

        BufferedImage image = ImageIO.read(originalPath.toFile());
        if (image == null) {
            throw new IOException("Failed to read image: " + originalPath);
        }

        String webpFileName = fileName.replaceFirst("\\.[^.]+$", ".webp");
        Path webpPath = Paths.get(uploadDir, subfolder, webpFileName);

        saveAsWebP(image, webpPath.toFile());

        log.info("WebP created: {}", webpFileName);
        return String.format("/uploads/%s/%s", subfolder, webpFileName);
    }

    /**
     * BufferedImage를 WebP 파일로 저장
     */
    private void saveAsWebP(BufferedImage image, File outputFile) throws IOException {
        // WebP 라이터 찾기
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByMIMEType("image/webp");

        if (writers.hasNext()) {
            ImageWriter writer = writers.next();
            ImageWriteParam param = writer.getDefaultWriteParam();

            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(webpQuality);
            }

            try (ImageOutputStream ios = ImageIO.createImageOutputStream(outputFile)) {
                writer.setOutput(ios);
                writer.write(null, new IIOImage(image, null, null), param);
            } finally {
                writer.dispose();
            }
        } else {
            // WebP 라이터가 없으면 고품질 JPEG로 저장
            log.warn("WebP writer not available, saving as JPEG instead");
            saveAsJpeg(image, outputFile.getAbsolutePath().replace(".webp", ".jpg"));
        }
    }

    /**
     * 고품질 JPEG로 저장
     */
    private void saveAsJpeg(BufferedImage image, String outputPath) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("No JPEG writer available");
        }

        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(COMPRESSION_QUALITY);

        try (ImageOutputStream ios = ImageIO.createImageOutputStream(new File(outputPath))) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
    }

    /**
     * 폴더 내 모든 이미지를 WebP로 일괄 변환
     */
    @Async
    public CompletableFuture<Integer> batchConvertToWebP(String subfolder) {
        int converted = 0;
        Path folderPath = Paths.get(uploadDir, subfolder);

        try {
            if (!Files.exists(folderPath)) {
                return CompletableFuture.completedFuture(0);
            }

            List<Path> imageFiles = Files.list(folderPath)
                    .filter(path -> {
                        String name = path.getFileName().toString().toLowerCase();
                        return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
                    })
                    .filter(path -> {
                        // WebP 버전이 없는 파일만
                        String webpName = path.getFileName().toString().replaceFirst("\\.[^.]+$", ".webp");
                        return !Files.exists(path.getParent().resolve(webpName));
                    })
                    .toList();

            for (Path imagePath : imageFiles) {
                try {
                    convertToWebPAndSave(imagePath.getFileName().toString(), subfolder);
                    converted++;
                } catch (IOException e) {
                    log.error("Failed to convert: {}", imagePath, e);
                }
            }

            log.info("Batch WebP conversion complete: {} files converted in {}", converted, subfolder);
        } catch (IOException e) {
            log.error("Batch conversion failed for folder: {}", subfolder, e);
        }

        return CompletableFuture.completedFuture(converted);
    }

    /**
     * Accept 헤더 기반 최적 이미지 URL 반환
     */
    public String getOptimalImageUrl(String imagePath, String acceptHeader) {
        if (acceptHeader != null && acceptHeader.contains("image/webp")) {
            String webpPath = imagePath.replaceFirst("\\.[^.]+$", ".webp");
            Path fullWebpPath = Paths.get(uploadDir, webpPath.substring(webpPath.indexOf("/uploads/") + 9));
            if (Files.exists(fullWebpPath)) {
                return webpPath;
            }
        }
        return imagePath;
    }

    /**
     * WebP 지원 여부 확인
     */
    public boolean isWebPSupported() {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByMIMEType("image/webp");
        return writers.hasNext();
    }
}
