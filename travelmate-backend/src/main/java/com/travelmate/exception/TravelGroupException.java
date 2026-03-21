package com.travelmate.exception;

import org.springframework.http.HttpStatus;

public class TravelGroupException extends BaseException {

    public static class GroupNotFoundException extends TravelGroupException {
        public GroupNotFoundException() { this("여행 그룹을 찾을 수 없습니다."); }
        public GroupNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class GroupFullException extends TravelGroupException {
        public GroupFullException() { this("그룹 정원이 초과되었습니다."); }
        public GroupFullException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    public static class GroupNotRecruitingException extends TravelGroupException {
        public GroupNotRecruitingException() { this("모집중인 그룹이 아닙니다."); }
        public GroupNotRecruitingException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    public static class AlreadyJoinedException extends TravelGroupException {
        public AlreadyJoinedException() { this("이미 그룹에 가입되어 있습니다."); }
        public AlreadyJoinedException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    public static class UnauthorizedGroupAccessException extends TravelGroupException {
        public UnauthorizedGroupAccessException() { this("그룹 관리자 권한이 필요합니다."); }
        public UnauthorizedGroupAccessException(String message) {
            super(message, HttpStatus.FORBIDDEN);
        }
    }

    public static class CreatorCannotLeaveException extends TravelGroupException {
        public CreatorCannotLeaveException() { this("그룹 생성자는 그룹을 떠날 수 없습니다."); }
        public CreatorCannotLeaveException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }

    public TravelGroupException(String message, HttpStatus status) {
        super(message, status);
    }
}