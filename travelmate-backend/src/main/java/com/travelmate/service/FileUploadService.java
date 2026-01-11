package com.travelmate.service;

import com.travelmate.entity.UploadedFile;
import com.travelmate.entity.User;
import com.travelmate.repository.UploadedFileRepository;
import com.travelmate.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@Transactional
public class FileUploadService {

    private final UploadedFileRepository uploadedFileRepository;
    private final UserRepository userRepository;

    @Value("${app.file.upload.path:./uploads/}")
    private String uploadPath;

    @Value("${app.file.upload.max-size:10485760}") // 10MB default
    private Long maxFileSize;

    private Path uploadDir;

    public FileUploadService(UploadedFileRepository uploadedFileRepository, UserRepository userRepository) {
        this.uploadedFileRepository = uploadedFileRepository;
        this.userRepository = userRepository;
    }

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp", "bmp");
    private static final List<String> ALLOWED_DOCUMENT_EXTENSIONS = Arrays.asList("pdf", "doc", "docx");
    private static final List<String> DANGEROUS_EXTENSIONS = Arrays.asList("exe", "bat", "sh", "dll", "com", "cmd", "vbs", "js");

    private static final Map<String, byte[]> FILE_SIGNATURES = new HashMap<>();
    static {
        FILE_SIGNATURES.put("jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
        FILE_SIGNATURES.put("jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
        FILE_SIGNATURES.put("png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
        FILE_SIGNATURES.put("gif", new byte[]{0x47, 0x49, 0x46, 0x38});
        FILE_SIGNATURES.put("webp", new byte[]{0x52, 0x49, 0x46, 0x46});
        FILE_SIGNATURES.put("bmp", new byte[]{0x42, 0x4D});
        FILE_SIGNATURES.put("pdf", new byte[]{0x25, 0x50, 0x44, 0x46});
    }

    @PostConstruct
    public void init() {
        try {
            this.uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload directory", e);
        }
    }
    
    public String uploadImage(MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_EXTENSIONS);
        return saveFile(file, "images");
    }

    public String uploadImage(MultipartFile file, Long userId) {
        validateFile(file, ALLOWED_IMAGE_EXTENSIONS);
        return saveFileWithOwner(file, "images", userId, "image");
    }

    public String uploadDocument(MultipartFile file) {
        validateFile(file, ALLOWED_DOCUMENT_EXTENSIONS);
        return saveFile(file, "documents");
    }

    public String uploadDocument(MultipartFile file, Long userId) {
        validateFile(file, ALLOWED_DOCUMENT_EXTENSIONS);
        return saveFileWithOwner(file, "documents", userId, "document");
    }

    public String uploadProfileImage(MultipartFile file, Long userId) {
        validateFile(file, ALLOWED_IMAGE_EXTENSIONS);
        String fileName = "profile_" + userId + "_" + UUID.randomUUID() + getFileExtension(file.getOriginalFilename());
        return saveFileWithOwner(file, "profiles", fileName, userId, "profile");
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

        if (!validateMimeType(file, extension)) {
            log.warn("MIME 타입 불일치 - 파일: {}, 확장자: {}", originalFilename, extension);
            throw new IllegalArgumentException("파일 내용이 확장자와 일치하지 않습니다.");
        }
    }

    private boolean validateMimeType(MultipartFile file, String extension) {
        byte[] signature = FILE_SIGNATURES.get(extension);
        if (signature == null) return true;
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[signature.length];
            if (is.read(header) < signature.length) return false;
            for (int i = 0; i < signature.length; i++) {
                if (header[i] != signature[i]) return false;
            }
            return true;
        } catch (IOException e) {
            return false;
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

    private String saveFileWithOwner(MultipartFile file, String subfolder, Long userId, String fileType) {
        String fileName = UUID.randomUUID() + getFileExtension(file.getOriginalFilename());
        return saveFileWithOwner(file, subfolder, fileName, userId, fileType);
    }

    private String saveFileWithOwner(MultipartFile file, String subfolder, String fileName, Long userId, String fileType) {
        String fileUrl = saveFile(file, subfolder, fileName);

        // 파일 소유자 정보 저장
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        UploadedFile uploadedFile = UploadedFile.builder()
            .user(user)
            .fileUrl(fileUrl)
            .originalFilename(file.getOriginalFilename())
            .fileType(fileType)
            .fileSize(file.getSize())
            .contentType(file.getContentType())
            .build();

        uploadedFileRepository.save(uploadedFile);
        log.info("파일 소유자 정보 저장: userId={}, fileUrl={}", userId, fileUrl);

        return fileUrl;
    }

    /**
     * 파일 삭제 (권한 검증 없음 - 내부용)
     */
    public void deleteFile(String fileUrl) {
        deleteFileInternal(fileUrl);
        // DB에서 파일 정보 삭제
        uploadedFileRepository.findByFileUrl(fileUrl).ifPresent(uploadedFileRepository::delete);
    }

    /**
     * 파일 삭제 (권한 검증 포함)
     * @param fileUrl 삭제할 파일 URL
     * @param userId 요청한 사용자 ID
     * @throws SecurityException 권한이 없는 경우
     */
    public void deleteFileWithAuth(String fileUrl, Long userId) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        // 파일 소유자 확인
        UploadedFile uploadedFile = uploadedFileRepository.findByFileUrl(fileUrl).orElse(null);

        if (uploadedFile != null) {
            // 파일 소유자만 삭제 가능
            if (!uploadedFile.getUser().getId().equals(userId)) {
                log.warn("파일 삭제 권한 없음: userId={}, fileUrl={}, ownerId={}",
                    userId, fileUrl, uploadedFile.getUser().getId());
                throw new SecurityException("파일 삭제 권한이 없습니다.");
            }
            uploadedFileRepository.delete(uploadedFile);
        } else {
            // DB에 소유자 정보가 없는 기존 파일은 삭제 불가 (보안)
            log.warn("파일 소유자 정보 없음, 삭제 거부: fileUrl={}", fileUrl);
            throw new SecurityException("파일 삭제 권한을 확인할 수 없습니다.");
        }

        deleteFileInternal(fileUrl);
    }

    /**
     * 파일 물리적 삭제 (내부용)
     */
    private void deleteFileInternal(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        try {
            String filePath = fileUrl.replace("/uploads/", "");
            Path targetPath = uploadDir.resolve(filePath).normalize();
            if (!targetPath.startsWith(uploadDir)) {
                log.warn("경로 순회 공격 시도: {}", fileUrl);
                throw new SecurityException("잘못된 파일 경로입니다.");
            }

            if (Files.exists(targetPath)) {
                Files.delete(targetPath);
                log.info("파일 삭제 완료: {}", fileUrl);
            }
        } catch (SecurityException e) {
            throw e;
        } catch (IOException e) {
            log.error("파일 삭제 실패: {}", fileUrl, e);
        }
    }

    /**
     * 파일 소유자 확인
     */
    public boolean isFileOwner(String fileUrl, Long userId) {
        return uploadedFileRepository.existsByFileUrlAndUserId(fileUrl, userId);
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
            Path targetPath = uploadDir.resolve(filePath).normalize();
            if (!targetPath.startsWith(uploadDir)) {
                return false;
            }
            return Files.exists(targetPath);
        }

        return false;
    }
}