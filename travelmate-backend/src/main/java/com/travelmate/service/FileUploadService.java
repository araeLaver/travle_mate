package com.travelmate.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {

    @Value("${app.file.upload.path:./uploads/}")
    private String uploadPath;

    @Value("${app.file.upload.max-size:10485760}") // 10MB default
    private Long maxFileSize;

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp", "bmp");
    private static final List<String> ALLOWED_DOCUMENT_EXTENSIONS = Arrays.asList("pdf", "doc", "docx");
    private static final List<String> DANGEROUS_EXTENSIONS = Arrays.asList("exe", "bat", "sh", "dll", "com", "cmd", "vbs", "js");
    
    public String uploadImage(MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_EXTENSIONS);
        return saveFile(file, "images");
    }

    public String uploadDocument(MultipartFile file) {
        validateFile(file, ALLOWED_DOCUMENT_EXTENSIONS);
        return saveFile(file, "documents");
    }

    public String uploadProfileImage(MultipartFile file, Long userId) {
        validateFile(file, ALLOWED_IMAGE_EXTENSIONS);
        String fileName = "profile_" + userId + "_" + UUID.randomUUID() + getFileExtension(file.getOriginalFilename());
        return saveFile(file, "profiles", fileName);
    }

    private void validateFile(MultipartFile file, List<String> allowedExtensions) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                String.format("파일 크기가 너무 큽니다. 최대 크기: %dMB", maxFileSize / 1024 / 1024)
            );
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.contains("..")) {
            throw new IllegalArgumentException("유효하지 않은 파일명입니다.");
        }

        String extension = getFileExtension(originalFilename).toLowerCase().replace(".", "");

        // 위험한 확장자 체크
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            log.warn("위험한 파일 업로드 시도: {}", originalFilename);
            throw new IllegalArgumentException("보안상 허용되지 않는 파일 형식입니다.");
        }

        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException(
                "허용되지 않은 파일 형식입니다. 허용되는 형식: " + allowedExtensions
            );
        }
    }

    private String saveFile(MultipartFile file, String subfolder) {
        String fileName = UUID.randomUUID() + getFileExtension(file.getOriginalFilename());
        return saveFile(file, subfolder, fileName);
    }

    private String saveFile(MultipartFile file, String subfolder, String fileName) {
        try {
            Path uploadDir = Paths.get(uploadPath, subfolder);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
                log.info("업로드 디렉토리 생성: {}", uploadDir);
            }

            Path targetPath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + subfolder + "/" + fileName;
            log.info("파일 업로드 완료: {} (크기: {}bytes, 타입: {})",
                fileUrl, file.getSize(), file.getContentType());

            return fileUrl;
        } catch (IOException e) {
            log.error("파일 업로드 실패: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("파일 업로드에 실패했습니다.", e);
        }
    }
    
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        try {
            String filePath = fileUrl.replace("/uploads/", "");
            Path targetPath = Paths.get(uploadPath, filePath);

            if (Files.exists(targetPath)) {
                Files.delete(targetPath);
                log.info("파일 삭제 완료: {}", fileUrl);
            } else {
                log.warn("삭제할 파일이 존재하지 않습니다: {}", fileUrl);
            }
        } catch (IOException e) {
            log.error("파일 삭제 실패: {}", fileUrl, e);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }

        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return "";
        }

        return filename.substring(lastDotIndex).toLowerCase();
    }

    public boolean isValidImageUrl(String url) {
        if (url == null || url.isEmpty()) {
            return false;
        }

        if (url.startsWith("http://") || url.startsWith("https://")) {
            return true;
        }

        if (url.startsWith("/uploads/")) {
            String filePath = url.replace("/uploads/", "");
            Path targetPath = Paths.get(uploadPath, filePath);
            return Files.exists(targetPath);
        }

        return false;
    }
}