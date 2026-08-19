package com.travelmate.security;

import org.springframework.security.access.AccessDeniedException;

import java.security.Principal;

public final class AuthenticatedUserId {

    private AuthenticatedUserId() {
    }

    public static Long parse(String userId) {
        return parse(
                userId,
                "Authenticated user principal is required",
                "Invalid authenticated user principal");
    }

    public static Long parse(Principal principal) {
        return parse(
                principal,
                "Authenticated user principal is required",
                "Invalid authenticated user principal");
    }

    public static Long parse(Principal principal, String missingMessage, String invalidMessage) {
        if (principal == null) {
            throw new AccessDeniedException(missingMessage);
        }

        return parse(principal.getName(), missingMessage, invalidMessage);
    }

    public static Long parse(String userId, String missingMessage, String invalidMessage) {
        if (userId == null || userId.isBlank()) {
            throw new AccessDeniedException(missingMessage);
        }

        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException ex) {
            throw new AccessDeniedException(invalidMessage, ex);
        }
    }
}
