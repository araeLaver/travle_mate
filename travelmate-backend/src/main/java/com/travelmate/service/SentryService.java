package com.travelmate.service;

import io.sentry.*;
import io.sentry.protocol.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Service for Sentry error tracking operations
 * Provides methods to capture errors, set context, and track transactions
 */
@Service
@Slf4j
public class SentryService {

    @Value("${sentry.enabled:false}")
    private boolean sentryEnabled;

    /**
     * Capture an exception with additional context
     */
    public void captureException(Throwable throwable, Map<String, Object> extras) {
        if (!sentryEnabled) {
            log.error("Error captured (Sentry disabled)", throwable);
            return;
        }

        Sentry.withScope(scope -> {
            if (extras != null) {
                extras.forEach((key, value) -> scope.setExtra(key, value != null ? value.toString() : "null"));
            }
            Sentry.captureException(throwable);
        });
    }

    /**
     * Capture an exception
     */
    public void captureException(Throwable throwable) {
        captureException(throwable, null);
    }

    /**
     * Capture a message
     */
    public void captureMessage(String message, SentryLevel level) {
        if (!sentryEnabled) {
            log.info("Message captured (Sentry disabled): {}", message);
            return;
        }

        Sentry.captureMessage(message, level);
    }

    /**
     * Capture an info message
     */
    public void captureInfo(String message) {
        captureMessage(message, SentryLevel.INFO);
    }

    /**
     * Capture a warning message
     */
    public void captureWarning(String message) {
        captureMessage(message, SentryLevel.WARNING);
    }

    /**
     * Capture an error message
     */
    public void captureError(String message) {
        captureMessage(message, SentryLevel.ERROR);
    }

    /**
     * Set user context for the current session
     */
    public void setUser(Long userId, String email, String username) {
        if (!sentryEnabled) return;

        User user = new User();
        user.setId(userId != null ? userId.toString() : null);
        user.setEmail(email);
        user.setUsername(username);

        Sentry.setUser(user);
    }

    /**
     * Clear user context
     */
    public void clearUser() {
        if (!sentryEnabled) return;
        Sentry.setUser(null);
    }

    /**
     * Add a breadcrumb for debugging
     */
    public void addBreadcrumb(String category, String message) {
        if (!sentryEnabled) return;

        Breadcrumb breadcrumb = new Breadcrumb();
        breadcrumb.setCategory(category);
        breadcrumb.setMessage(message);
        breadcrumb.setLevel(SentryLevel.INFO);

        Sentry.addBreadcrumb(breadcrumb);
    }

    /**
     * Add a breadcrumb with data
     */
    public void addBreadcrumb(String category, String message, Map<String, Object> data) {
        if (!sentryEnabled) return;

        Breadcrumb breadcrumb = new Breadcrumb();
        breadcrumb.setCategory(category);
        breadcrumb.setMessage(message);
        breadcrumb.setLevel(SentryLevel.INFO);

        if (data != null) {
            data.forEach((key, value) -> breadcrumb.setData(key, value));
        }

        Sentry.addBreadcrumb(breadcrumb);
    }

    /**
     * Set a tag for the current scope
     */
    public void setTag(String key, String value) {
        if (!sentryEnabled) return;
        Sentry.setTag(key, value);
    }

    /**
     * Set extra context data
     */
    public void setExtra(String key, Object value) {
        if (!sentryEnabled) return;
        Sentry.setExtra(key, value != null ? value.toString() : "null");
    }

    /**
     * Start a manual transaction
     */
    public ITransaction startTransaction(String name, String operation) {
        if (!sentryEnabled) return null;
        return Sentry.startTransaction(name, operation);
    }

    /**
     * Start a child span on the current transaction
     */
    public ISpan startSpan(String operation, String description) {
        if (!sentryEnabled) return null;

        ISpan currentSpan = Sentry.getSpan();
        if (currentSpan != null) {
            return currentSpan.startChild(operation, description);
        }
        return null;
    }

    /**
     * Track a business event
     */
    public void trackEvent(String eventName, Map<String, Object> properties) {
        if (!sentryEnabled) return;

        addBreadcrumb("event", eventName, properties);

        // Optionally send as a custom message with properties
        Sentry.withScope(scope -> {
            if (properties != null) {
                properties.forEach((key, value) -> scope.setExtra(key, value != null ? value.toString() : "null"));
            }
            scope.setTag("event.type", eventName);
            Sentry.captureMessage("Event: " + eventName, SentryLevel.INFO);
        });
    }

    /**
     * Track NFT minting event
     */
    public void trackNftMinting(Long userId, Long collectionId, boolean success, String transactionHash) {
        trackEvent("nft_minting", Map.of(
                "user_id", userId,
                "collection_id", collectionId,
                "success", success,
                "transaction_hash", transactionHash != null ? transactionHash : "N/A"
        ));
    }

    /**
     * Track user registration
     */
    public void trackUserRegistration(Long userId, String provider) {
        trackEvent("user_registration", Map.of(
                "user_id", userId,
                "auth_provider", provider
        ));
    }

    /**
     * Track payment event
     */
    public void trackPayment(Long userId, String productId, String transactionId, boolean success) {
        trackEvent("payment", Map.of(
                "user_id", userId,
                "product_id", productId,
                "transaction_id", transactionId != null ? transactionId : "N/A",
                "success", success
        ));
    }

    /**
     * Check if Sentry is enabled
     */
    public boolean isEnabled() {
        return sentryEnabled;
    }
}
