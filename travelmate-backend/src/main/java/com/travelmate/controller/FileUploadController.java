package com.travelmate.controller;

import com.travelmate.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping("/upload/image")
    public ResponseEntity<Map<String, String>> uploadImage(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            // 파일 소유자 정보와 함께 저장
            String fileUrl = fileUploadService.uploadImage(file, userId);
            log.info("이미지 업로드 성공: {} by user {}", fileUrl, userId);
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "url", fileUrl,
                "message", "이미지 업로드 성공"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/upload/profile")
    public ResponseEntity<Map<String, String>> uploadProfileImage(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = fileUploadService.uploadProfileImage(file, userId);
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "url", fileUrl,
                "message", "프로필 이미지 업로드 성공"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/upload/document")
    public ResponseEntity<Map<String, String>> uploadDocument(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            // 파일 소유자 정보와 함께 저장
            String fileUrl = fileUploadService.uploadDocument(file, userId);
            log.info("문서 업로드 성공: {} by user {}", fileUrl, userId);
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "url", fileUrl,
                "message", "문서 업로드 성공"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, String>> deleteFile(
            @AuthenticationPrincipal Long userId,
            @RequestParam("url") String fileUrl) {
        try {
            // 파일 소유자만 삭제 가능 (권한 검증 포함)
            fileUploadService.deleteFileWithAuth(fileUrl, userId);
            log.info("파일 삭제 성공: {} by user {}", fileUrl, userId);
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "파일 삭제 성공"
            ));
        } catch (SecurityException e) {
            log.warn("파일 삭제 권한 없음: {} by user {}", fileUrl, userId);
            return ResponseEntity.status(403).body(Map.of(
                "success", "false",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("파일 삭제 실패: {} by user {}", fileUrl, userId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", "파일 삭제 실패"
            ));
        }
    }
}
