package hu.elte.ik.thesis.cinegrade.handler;

import org.springframework.http.HttpStatus;

import lombok.Getter;

public enum BusinessErrorCodes {

	NO_CODE(0, HttpStatus.NOT_IMPLEMENTED, "No code"),
	INCORRECT_CURRENT_PASSWORD(300, HttpStatus.BAD_REQUEST, "Current password is incorrect"),
	NEW_PASSWORD_DOES_NOT_MATCH(301, HttpStatus.BAD_REQUEST, "THe new password does not match"),
	ACCOUNT_LOCKED(302, HttpStatus.FORBIDDEN, "User account is locked"),
	ACCOUNT_DISABLED(303, HttpStatus.FORBIDDEN, "User account is disabled"),
	BAD_CREDENTIALS(304, HttpStatus.FORBIDDEN, "The username/password is incorrect"),
	USERNAME_TAKEN(305, HttpStatus.CONFLICT, "That username is already taken"),
	EMAIL_TAKEN(306, HttpStatus.CONFLICT, "That email is already registered"),
	INVALID_ACTIVATION_CODE(307, HttpStatus.BAD_REQUEST, "That activation code is not valid"),
	ACTIVATION_CODE_EXPIRED(308, HttpStatus.BAD_REQUEST, "That activation code has expired. We sent a new one to your email"),
	ACTIVATION_ATTEMPTS_EXCEEDED(309, HttpStatus.BAD_REQUEST, "You have exceeded the maximum number of activation attempts"),
	FAILED_TO_SEND_VALIDATION_EMAIL(310, HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send validation email"),
	INVALID_SESSION(311, HttpStatus.UNAUTHORIZED, "Invalid session");

	@Getter
	private final int code;
	@Getter
	private final String description;
	@Getter
	private final HttpStatus httpStatus;

	private BusinessErrorCodes(int code, HttpStatus httpStatus, String description) {
		this.code = code;
		this.description = description;
		this.httpStatus = httpStatus;
	}
}
