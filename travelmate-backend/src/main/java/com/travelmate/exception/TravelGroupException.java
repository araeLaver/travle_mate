package com.travelmate.exception;

import org.springframework.http.HttpStatus;

public class TravelGroupException extends BaseException {

    public static class GroupNotFoundException extends TravelGroupException {
        public GroupNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class GroupFullException extends TravelGroupException {
        public GroupFullException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    public static class GroupNotRecruitingException extends TravelGroupException {
        public GroupNotRecruitingException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    public static class AlreadyJoinedException extends TravelGroupException {
        public AlreadyJoinedException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    public static class UnauthorizedGroupAccessException extends TravelGroupException {
        public UnauthorizedGroupAccessException(String message) {
            super(message, HttpStatus.FORBIDDEN);
        }
    }

    public static class CreatorCannotLeaveException extends TravelGroupException {
        public CreatorCannotLeaveException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }

    public TravelGroupException(String message, HttpStatus status) {
        super(message, status);
    }
}