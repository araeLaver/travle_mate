package com.travelmate.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Firebase Configuration for Push Notifications
 */
@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials.path:}")
    private String credentialsPath;

    @Value("${firebase.credentials.json:}")
    private String credentialsJson;

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    @PostConstruct
    public void initialize() {
        if (!firebaseEnabled) {
            log.info("Firebase is disabled. Skipping initialization.");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = buildFirebaseOptions();
                FirebaseApp.initializeApp(options);
                log.info("Firebase has been initialized successfully");
            }
        } catch (Exception e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
        }
    }

    private FirebaseOptions buildFirebaseOptions() throws IOException {
        InputStream serviceAccount = getCredentialsInputStream();

        return FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();
    }

    private InputStream getCredentialsInputStream() throws IOException {
        // First try to use JSON string from environment variable
        if (credentialsJson != null && !credentialsJson.isBlank()) {
            log.info("Using Firebase credentials from JSON configuration");
            return new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8));
        }

        // Then try to use file path
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            log.info("Using Firebase credentials from file: {}", credentialsPath);
            Resource resource = new ClassPathResource(credentialsPath);
            return resource.getInputStream();
        }

        throw new IllegalStateException(
                "Firebase credentials not configured. Set either firebase.credentials.json or firebase.credentials.path"
        );
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        if (!firebaseEnabled || FirebaseApp.getApps().isEmpty()) {
            log.warn("FirebaseMessaging bean not created - Firebase is not initialized");
            return null;
        }
        return FirebaseMessaging.getInstance();
    }
}
