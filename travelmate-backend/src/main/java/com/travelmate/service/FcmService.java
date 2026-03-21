package com.travelmate.service;

import com.google.firebase.messaging.*;
import com.travelmate.dto.PushNotificationDto;
import com.travelmate.entity.DeviceToken;
import com.travelmate.entity.User;
import com.travelmate.repository.DeviceTokenRepository;
import com.travelmate.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Firebase Cloud Messaging Service
 */
@Service
@Slf4j
public class FcmService {

    private final FirebaseMessaging firebaseMessaging;
    private final DeviceTokenRepository deviceTokenRepository;
    private final UserRepository userRepository;

    @Autowired
    public FcmService(@Autowired(required = false) FirebaseMessaging firebaseMessaging,
                      DeviceTokenRepository deviceTokenRepository,
                      UserRepository userRepository) {
        this.firebaseMessaging = firebaseMessaging;
        this.deviceTokenRepository = deviceTokenRepository;
        this.userRepository = userRepository;
    }

    private static final int BATCH_SIZE = 500; // FCM limit

    /**
     * Register device token for push notifications
     */
    @Transactional
    public PushNotificationDto.TokenResponse registerToken(Long userId, PushNotificationDto.RegisterTokenRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // Check if token already exists
        Optional<DeviceToken> existingToken = deviceTokenRepository.findByToken(request.getToken());

        DeviceToken deviceToken;
        if (existingToken.isPresent()) {
            // Update existing token
            deviceToken = existingToken.get();
            deviceToken.setUser(user);
            deviceToken.setDeviceType(request.getDeviceType());
            deviceToken.setDeviceModel(request.getDeviceModel());
            deviceToken.setOsVersion(request.getOsVersion());
            deviceToken.setAppVersion(request.getAppVersion());
            deviceToken.setActive(true);
            deviceToken.updateLastUsed();
        } else {
            // Create new token
            deviceToken = DeviceToken.builder()
                    .user(user)
                    .token(request.getToken())
                    .deviceType(request.getDeviceType())
                    .deviceModel(request.getDeviceModel())
                    .osVersion(request.getOsVersion())
                    .appVersion(request.getAppVersion())
                    .build();
        }

        deviceToken = deviceTokenRepository.save(deviceToken);
        log.info("Registered device token for user {}: {}", userId, deviceToken.getId());

        return PushNotificationDto.TokenResponse.builder()
                .id(deviceToken.getId())
                .token(deviceToken.getToken())
                .deviceType(deviceToken.getDeviceType())
                .deviceModel(deviceToken.getDeviceModel())
                .active(deviceToken.isActive())
                .build();
    }

    /**
     * Unregister device token
     */
    @Transactional
    public void unregisterToken(Long userId, String token) {
        deviceTokenRepository.findByToken(token).ifPresent(deviceToken -> {
            if (deviceToken.getUser().getId().equals(userId)) {
                deviceToken.deactivate();
                deviceTokenRepository.save(deviceToken);
                log.info("Unregistered device token for user {}", userId);
            }
        });
    }

    /**
     * Send notification to a single user
     */
    @Async
    public void sendToUser(Long userId, PushNotificationDto.NotificationPayload payload) {
        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndActiveTrue(userId);

        if (tokens.isEmpty()) {
            log.debug("No active tokens found for user {}", userId);
            return;
        }

        List<String> tokenStrings = tokens.stream()
                .map(DeviceToken::getToken)
                .collect(Collectors.toList());

        sendToTokens(tokenStrings, payload);
    }

    /**
     * Send notification to multiple users
     */
    @Async
    public void sendToUsers(List<Long> userIds, PushNotificationDto.NotificationPayload payload) {
        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdsAndActiveTrue(userIds);

        if (tokens.isEmpty()) {
            log.debug("No active tokens found for users {}", userIds);
            return;
        }

        List<String> tokenStrings = tokens.stream()
                .map(DeviceToken::getToken)
                .collect(Collectors.toList());

        sendToTokens(tokenStrings, payload);
    }

    /**
     * Send notification to specific tokens
     */
    public PushNotificationDto.SendResult sendToTokens(List<String> tokens, PushNotificationDto.NotificationPayload payload) {
        if (firebaseMessaging == null) {
            log.warn("FirebaseMessaging is not initialized. Skipping push notification.");
            return PushNotificationDto.SendResult.builder()
                    .successCount(0)
                    .failureCount(tokens.size())
                    .failedTokens(tokens)
                    .build();
        }

        int totalSuccess = 0;
        int totalFailure = 0;
        List<String> allFailedTokens = new ArrayList<>();

        // Process in batches
        for (int i = 0; i < tokens.size(); i += BATCH_SIZE) {
            List<String> batch = tokens.subList(i, Math.min(i + BATCH_SIZE, tokens.size()));
            PushNotificationDto.SendResult batchResult = sendBatch(batch, payload);
            totalSuccess += batchResult.getSuccessCount();
            totalFailure += batchResult.getFailureCount();
            allFailedTokens.addAll(batchResult.getFailedTokens());
        }

        // Deactivate failed tokens
        if (!allFailedTokens.isEmpty()) {
            deactivateFailedTokens(allFailedTokens);
        }

        log.info("Push notification sent. Success: {}, Failure: {}", totalSuccess, totalFailure);

        return PushNotificationDto.SendResult.builder()
                .successCount(totalSuccess)
                .failureCount(totalFailure)
                .failedTokens(allFailedTokens)
                .build();
    }

    /**
     * Send batch of notifications
     */
    private PushNotificationDto.SendResult sendBatch(List<String> tokens, PushNotificationDto.NotificationPayload payload) {
        MulticastMessage message = buildMulticastMessage(tokens, payload);

        try {
            BatchResponse response = firebaseMessaging.sendEachForMulticast(message);

            List<String> failedTokens = new ArrayList<>();
            List<SendResponse> responses = response.getResponses();

            for (int i = 0; i < responses.size(); i++) {
                if (!responses.get(i).isSuccessful()) {
                    failedTokens.add(tokens.get(i));
                    log.debug("Failed to send to token: {}", responses.get(i).getException().getMessage());
                }
            }

            return PushNotificationDto.SendResult.builder()
                    .successCount(response.getSuccessCount())
                    .failureCount(response.getFailureCount())
                    .failedTokens(failedTokens)
                    .build();

        } catch (FirebaseMessagingException e) {
            log.error("Failed to send batch notification: {}", e.getMessage());
            return PushNotificationDto.SendResult.builder()
                    .successCount(0)
                    .failureCount(tokens.size())
                    .failedTokens(tokens)
                    .build();
        }
    }

    /**
     * Build multicast message
     */
    private MulticastMessage buildMulticastMessage(List<String> tokens, PushNotificationDto.NotificationPayload payload) {
        Notification.Builder notificationBuilder = Notification.builder()
                .setTitle(payload.getTitle())
                .setBody(payload.getBody());

        if (payload.getImageUrl() != null) {
            notificationBuilder.setImage(payload.getImageUrl());
        }

        MulticastMessage.Builder messageBuilder = MulticastMessage.builder()
                .addAllTokens(tokens)
                .setNotification(notificationBuilder.build());

        // Add data payload
        if (payload.getData() != null && !payload.getData().isEmpty()) {
            messageBuilder.putAllData(payload.getData());
        }

        // Add click action
        if (payload.getClickAction() != null) {
            messageBuilder.putData("click_action", payload.getClickAction());
        }

        // Android specific configuration
        messageBuilder.setAndroidConfig(AndroidConfig.builder()
                .setNotification(AndroidNotification.builder()
                        .setIcon(payload.getIcon() != null ? payload.getIcon() : "ic_notification")
                        .setSound(payload.getSound() != null ? payload.getSound() : "default")
                        .setClickAction(payload.getClickAction())
                        .build())
                .setPriority(AndroidConfig.Priority.HIGH)
                .build());

        // Apple specific configuration
        messageBuilder.setApnsConfig(ApnsConfig.builder()
                .setAps(Aps.builder()
                        .setSound(payload.getSound() != null ? payload.getSound() : "default")
                        .setBadge(payload.getBadge() != null ? Integer.parseInt(payload.getBadge()) : null)
                        .build())
                .build());

        // Web push configuration
        messageBuilder.setWebpushConfig(WebpushConfig.builder()
                .setNotification(WebpushNotification.builder()
                        .setTitle(payload.getTitle())
                        .setBody(payload.getBody())
                        .setIcon(payload.getIcon())
                        .setBadge(payload.getBadge())
                        .build())
                .setFcmOptions(WebpushFcmOptions.builder()
                        .setLink(payload.getClickAction())
                        .build())
                .build());

        return messageBuilder.build();
    }

    /**
     * Deactivate failed tokens
     */
    @Transactional
    public void deactivateFailedTokens(List<String> tokens) {
        tokens.forEach(token -> {
            try {
                deviceTokenRepository.deactivateByToken(token);
            } catch (Exception e) {
                log.error("Failed to deactivate token: {}", e.getMessage());
            }
        });
    }

    /**
     * Send topic notification
     */
    public void sendToTopic(String topic, PushNotificationDto.NotificationPayload payload) {
        if (firebaseMessaging == null) {
            log.warn("FirebaseMessaging is not initialized. Skipping topic notification.");
            return;
        }

        Message message = Message.builder()
                .setTopic(topic)
                .setNotification(Notification.builder()
                        .setTitle(payload.getTitle())
                        .setBody(payload.getBody())
                        .setImage(payload.getImageUrl())
                        .build())
                .putAllData(payload.getData() != null ? payload.getData() : Map.of())
                .build();

        try {
            String response = firebaseMessaging.send(message);
            log.info("Topic notification sent to {}: {}", topic, response);
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send topic notification: {}", e.getMessage());
        }
    }

    /**
     * Subscribe user to topic
     */
    public void subscribeToTopic(Long userId, String topic) {
        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndActiveTrue(userId);
        List<String> tokenStrings = tokens.stream().map(DeviceToken::getToken).collect(Collectors.toList());

        if (tokenStrings.isEmpty() || firebaseMessaging == null) {
            return;
        }

        try {
            firebaseMessaging.subscribeToTopic(tokenStrings, topic);
            log.info("User {} subscribed to topic: {}", userId, topic);
        } catch (FirebaseMessagingException e) {
            log.error("Failed to subscribe to topic: {}", e.getMessage());
        }
    }

    /**
     * Unsubscribe user from topic
     */
    public void unsubscribeFromTopic(Long userId, String topic) {
        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndActiveTrue(userId);
        List<String> tokenStrings = tokens.stream().map(DeviceToken::getToken).collect(Collectors.toList());

        if (tokenStrings.isEmpty() || firebaseMessaging == null) {
            return;
        }

        try {
            firebaseMessaging.unsubscribeFromTopic(tokenStrings, topic);
            log.info("User {} unsubscribed from topic: {}", userId, topic);
        } catch (FirebaseMessagingException e) {
            log.error("Failed to unsubscribe from topic: {}", e.getMessage());
        }
    }
}
