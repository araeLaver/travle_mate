package com.travelmate.dto;

import com.travelmate.entity.TravelGroup;
import lombok.Data;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.Length;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class TravelGroupDto {
    
    @Data
    public static class CreateRequest {
        @NotBlank(message = "제목은 필수입니다")
        @Length(min = 2, max = 100, message = "제목은 2자 이상 100자 이하로 입력해주세요")
        private String title;

        @Length(max = 1000, message = "설명은 1000자 이하로 입력해주세요")
        private String description;

        @NotBlank(message = "목적지는 필수입니다")
        @Length(min = 2, max = 100, message = "목적지는 2자 이상 100자 이하로 입력해주세요")
        private String destination;

        @NotNull(message = "여행 시작일은 필수입니다")
        @Future(message = "여행 시작일은 현재 날짜 이후여야 합니다")
        private LocalDate startDate;

        @NotNull(message = "여행 종료일은 필수입니다")
        @Future(message = "여행 종료일은 현재 날짜 이후여야 합니다")
        private LocalDate endDate;

        @NotNull(message = "여행 목적은 필수입니다")
        private TravelGroup.Purpose purpose;

        @Min(value = 2, message = "최소 인원은 2명입니다")
        @Max(value = 20, message = "최대 인원은 20명입니다")
        private Integer maxMembers = 4;

        @NotNull(message = "만남 장소 위도는 필수입니다")
        @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다")
        @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다")
        private Double meetingLatitude;

        @NotNull(message = "만남 장소 경도는 필수입니다")
        @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다")
        @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다")
        private Double meetingLongitude;

        @Length(max = 200, message = "만남 장소 주소는 200자 이하로 입력해주세요")
        private String meetingAddress;

        @Future(message = "만남 시간은 현재 시간 이후여야 합니다")
        private LocalDateTime scheduledTime;
    }
    
    @Data
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private TravelGroup.Purpose purpose;
        private UserDto.Response creator;
        private Integer maxMembers;
        private Integer currentMemberCount;
        private Double meetingLatitude;
        private Double meetingLongitude;
        private String meetingAddress;
        private LocalDateTime scheduledTime;
        private TravelGroup.Status status;
        private LocalDateTime createdAt;
    }
    
    @Data
    public static class DetailResponse extends Response {
        private List<MemberDto> members;
        private Boolean isJoinedByCurrentUser;
        private Boolean canJoin;
    }
    
    @Data
    public static class MemberDto {
        private Long id;
        private UserDto.Response user;
        private String role;
        private String status;
        private LocalDateTime joinedAt;
    }
    
    @Data
    public static class UpdateRequest {
        private String title;
        private String description;
        private Integer maxMembers;
        private Double meetingLatitude;
        private Double meetingLongitude;
        private String meetingAddress;
        private LocalDateTime scheduledTime;
    }
    
    @Data
    public static class InviteRequest {
        @NotNull
        private Long inviteeId;
        
        private String message;
    }
    
    @Data
    public static class MemberResponse {
        private Long id;
        private UserDto.Response user;
        private String role;
        private String status;
        private LocalDateTime joinedAt;
        private Boolean isCreator;
    }
}