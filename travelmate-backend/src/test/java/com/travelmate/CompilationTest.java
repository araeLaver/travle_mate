package com.travelmate;

import com.travelmate.exception.ErrorResponse;
import com.travelmate.exception.BusinessException;
import com.travelmate.exception.ResourceNotFoundException;
import com.travelmate.entity.User;
import org.junit.jupiter.api.Test;

/**
 * Basic compilation test to verify all components compile correctly
 */
public class CompilationTest {

    @Test
    public void testBasicCompilation() {
        // Test that major classes can be instantiated
        
        // Test exception classes
        BusinessException businessEx = BusinessException.badRequest("test");
        ResourceNotFoundException resourceEx = ResourceNotFoundException.forUser(1L);
        
        // Test ErrorResponse builder
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(400)
                .error("Bad Request")
                .message("Test message")
                .code("TEST_ERROR")
                .path("/test")
                .build();
        
        // Test User entity
        User user = new User();
        user.setCurrentLatitude(37.5665);
        user.setCurrentLongitude(126.9780);
        
        // Verify getter methods exist
        Double lat = user.getCurrentLatitude();
        Double lng = user.getCurrentLongitude();
        
        assert lat != null;
        assert lng != null;
        assert businessEx != null;
        assert resourceEx != null;
        assert errorResponse != null;
    }
}