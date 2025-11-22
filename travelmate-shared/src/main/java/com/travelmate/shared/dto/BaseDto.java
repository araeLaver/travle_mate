package com.travelmate.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Base DTO class with common fields
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class BaseDto {
    private Long id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}