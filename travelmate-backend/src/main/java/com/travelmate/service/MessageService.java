package com.travelmate.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * 다국어 메시지 서비스
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageSource messageSource;

    /**
     * 현재 로케일에 맞는 메시지 조회
     */
    public String getMessage(String code) {
        return messageSource.getMessage(code, null, LocaleContextHolder.getLocale());
    }

    /**
     * 현재 로케일에 맞는 메시지 조회 (파라미터 포함)
     */
    public String getMessage(String code, Object... args) {
        return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
    }

    /**
     * 지정 로케일에 맞는 메시지 조회
     */
    public String getMessage(String code, Locale locale) {
        return messageSource.getMessage(code, null, locale);
    }

    /**
     * 지정 로케일에 맞는 메시지 조회 (파라미터 포함)
     */
    public String getMessage(String code, Locale locale, Object... args) {
        return messageSource.getMessage(code, args, locale);
    }

    /**
     * 기본값이 있는 메시지 조회
     */
    public String getMessageWithDefault(String code, String defaultMessage) {
        return messageSource.getMessage(code, null, defaultMessage, LocaleContextHolder.getLocale());
    }

    /**
     * 현재 로케일 반환
     */
    public Locale getCurrentLocale() {
        return LocaleContextHolder.getLocale();
    }

    /**
     * 한국어 로케일인지 확인
     */
    public boolean isKorean() {
        return LocaleContextHolder.getLocale().getLanguage().equals("ko");
    }

    /**
     * 영어 로케일인지 확인
     */
    public boolean isEnglish() {
        return LocaleContextHolder.getLocale().getLanguage().equals("en");
    }
}
