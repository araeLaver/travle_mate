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
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = fileUploadService.uploadImage(file);
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
            @AuthenticationPrincipal String userId,
            @RequestParam("file") MultipartFile file) {
        try {
            Long userIdLong = Long.parseLong(userId);
            String fileUrl = fileUploadService.uploadProfileImage(file, userIdLong);
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
    public ResponseEntity<Map<String, String>> uploadDocument(@RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = fileUploadService.uploadDocument(file);
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
    public ResponseEntity<Map<String, String>> deleteFile(@RequestParam("url") String fileUrl) {
        try {
            fileUploadService.deleteFile(fileUrl);
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "파일 삭제 성공"
            ));
        } catch (Exception e) {
            log.error("파일 삭제 실패: {}", fileUrl, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", "파일 삭제 실패"
            ));
        }
    }
}
