package com.travelmate.config;

import io.sentry.Sentry;
import io.sentry.SentryOptions;
import io.sentry.spring.jakarta.EnableSentry;
import io.sentry.spring.jakarta.tracing.SentryTracingFilter;
import jakarta.servlet.Filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * Sentry Configuration for error tracking and performance monitoring
 */
@Configuration
@EnableSentry(dsn = "${sentry.dsn:}")
@Slf4j
public class SentryConfig {

    @Value("${sentry.enabled:false}")
    private boolean sentryEnabled;

    @Value("${sentry.dsn:}")
    private String sentryDsn;

    @Value("${sentry.environment:development}")
    private String environment;

    @Value("${sentry.traces-sample-rate:0.1}")
    private double tracesSampleRate;

    @Value("${spring.application.name:travelmate-backend}")
    private String applicationName;

    /**
     * Configure Sentry options
     */
    @Bean
    public Sentry.OptionsConfiguration<SentryOptions> customSentryOptions() {
        return options -> {
            if (!sentryEnabled || sentryDsn.isEmpty()) {
                log.info("Sentry is disabled");
                return;
            }

            // Basic configuration
            options.setDsn(sentryDsn);
            options.setEnvironment(environment);
            options.setRelease(applicationName + "@1.0.0");

            // Performance monitoring
            options.setTracesSampleRate(tracesSampleRate);
            options.setEnableTracing(true);

            // Set server name
            options.setServerName(System.getenv("HOSTNAME"));

            // Tags for filtering
            options.setTag("application", applicationName);

            // Before send hook for filtering or modifying events
            options.setBeforeSend((event, hint) -> {
                // Filter out specific exceptions if needed
                if (event.getThrowable() != null) {
                    String message = event.getThrowable().getMessage();
                    if (message != null && message.contains("Connection refused")) {
                        // Optionally ignore certain errors
                        // return null;
                    }
                }

                // Add custom context
                event.setTag("java.version", System.getProperty("java.version"));

                return event;
            });

            // Before send transaction hook for performance events
            options.setBeforeSendTransaction((transaction, hint) -> {
                // Filter out health check transactions
                String transactionName = transaction.getTransaction();
                if (transactionName != null &&
                    (transactionName.contains("/actuator") ||
                     transactionName.contains("/health"))) {
                    return null;
                }
                return transaction;
            });

            // Sample rate for errors (1.0 = 100%)
            options.setSampleRate(1.0);

            // Enable auto session tracking
            options.setEnableAutoSessionTracking(true);

            // Maximum breadcrumbs
            options.setMaxBreadcrumbs(100);

            // Attach stacktrace
            options.setAttachStacktrace(true);

            // Send default PII (disable in production if needed)
            options.setSendDefaultPii(false);

            log.info("Sentry initialized for environment: {} with DSN: {}...",
                    environment, sentryDsn.substring(0, Math.min(20, sentryDsn.length())));
        };
    }

    /**
     * Register Sentry tracing filter for distributed tracing
     */
    @Bean
    public FilterRegistrationBean<Filter> sentryTracingFilter() {
        FilterRegistrationBean<Filter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new SentryTracingFilter());
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registrationBean;
    }
}
