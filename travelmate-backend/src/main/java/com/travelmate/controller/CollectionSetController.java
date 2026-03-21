package com.travelmate.controller;

import com.travelmate.service.nft.CollectionSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/nft/sets")
@RequiredArgsConstructor
public class CollectionSetController {

    private final CollectionSetService collectionSetService;

    @GetMapping
    public ResponseEntity<?> getAvailableSets() {
        return ResponseEntity.ok(collectionSetService.getAvailableSets());
    }

    @GetMapping("/region/{region}")
    public ResponseEntity<?> getSetsByRegion(@PathVariable String region) {
        return ResponseEntity.ok(collectionSetService.getSetsByRegion(region));
    }

    @GetMapping("/progress")
    public ResponseEntity<?> getMyProgress(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(collectionSetService.getUserSetProgress(userId));
    }

    @GetMapping("/{setId}/progress")
    public ResponseEntity<?> getSetProgress(@PathVariable Long setId, Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(collectionSetService.getSetProgress(setId, userId));
    }

    @GetMapping("/completed")
    public ResponseEntity<?> getCompletedSets(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(collectionSetService.checkNewlyCompletedSets(userId));
    }
}
