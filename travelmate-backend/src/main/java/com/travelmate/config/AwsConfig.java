package com.travelmate.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudfront.CloudFrontClient;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * AWS Configuration for TravelMate
 * Configures AWS SDK clients for S3, CloudFront, etc.
 */
@Configuration
public class AwsConfig {

    @Value("${aws.region:ap-northeast-2}")
    private String awsRegion;

    @Value("${aws.access-key-id:}")
    private String accessKeyId;

    @Value("${aws.secret-access-key:}")
    private String secretAccessKey;

    @Value("${aws.use-default-credentials:true}")
    private boolean useDefaultCredentials;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(getCredentialsProvider())
                .build();
    }

    @Bean
    public CloudFrontClient cloudFrontClient() {
        return CloudFrontClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(getCredentialsProvider())
                .build();
    }

    private software.amazon.awssdk.auth.credentials.AwsCredentialsProvider getCredentialsProvider() {
        if (useDefaultCredentials || accessKeyId.isEmpty()) {
            return DefaultCredentialsProvider.create();
        }
        return StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId, secretAccessKey)
        );
    }
}
