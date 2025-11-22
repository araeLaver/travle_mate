package com.travelmate.controller;

import com.travelmate.dto.TravelGroupDto;
import com.travelmate.entity.TravelGroup;
import com.travelmate.service.TravelGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${app.cors.allowed-origins:http://localhost:3000}"})
public class TravelGroupController {
    
    private final TravelGroupService travelGroupService;
    
    @PostMapping
    public ResponseEntity<TravelGroupDto.Response> createGroup(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody TravelGroupDto.CreateRequest request) {
        Long userIdLong = Long.parseLong(userId);
        TravelGroupDto.Response response = travelGroupService.createGroup(userIdLong, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping
    public ResponseEntity<List<TravelGroupDto.Response>> getGroups(
            @RequestParam(required = false) TravelGroup.Purpose purpose,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "10.0") Double radiusKm) {
        List<TravelGroupDto.Response> groups = travelGroupService.getGroups(purpose, latitude, longitude, radiusKm);
        return ResponseEntity.ok(groups);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TravelGroupDto.DetailResponse> getGroup(@PathVariable Long id) {
        TravelGroupDto.DetailResponse group = travelGroupService.getGroupDetail(id);
        return ResponseEntity.ok(group);
    }
    
    @PostMapping("/{id}/join")
    public ResponseEntity<Void> joinGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        travelGroupService.joinGroup(id, userIdLong);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        travelGroupService.leaveGroup(id, userIdLong);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TravelGroupDto.Response> updateGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody TravelGroupDto.UpdateRequest request) {
        Long userIdLong = Long.parseLong(userId);
        TravelGroupDto.Response response = travelGroupService.updateGroup(id, userIdLong, request);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateGroupStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId,
            @RequestParam TravelGroup.Status status) {
        Long userIdLong = Long.parseLong(userId);
        travelGroupService.updateGroupStatus(id, userIdLong, status);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/my-groups")
    public ResponseEntity<List<TravelGroupDto.Response>> getMyGroups(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        List<TravelGroupDto.Response> myGroups = travelGroupService.getMyGroups(userIdLong);
        return ResponseEntity.ok(myGroups);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        travelGroupService.deleteGroup(id, userIdLong);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/invite")
    public ResponseEntity<Void> inviteToGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody TravelGroupDto.InviteRequest request) {
        Long userIdLong = Long.parseLong(userId);
        travelGroupService.inviteToGroup(id, userIdLong, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    
    @GetMapping("/{id}/members")
    public ResponseEntity<List<TravelGroupDto.MemberResponse>> getGroupMembers(@PathVariable Long id) {
        List<TravelGroupDto.MemberResponse> members = travelGroupService.getGroupMembers(id);
        return ResponseEntity.ok(members);
    }
}