package hu.elte.ik.thesis.cinegrade.handler;

import org.springframework.http.HttpStatus;

import lombok.Getter;

public enum BusinessErrorCodes {

	NO_CODE(0, HttpStatus.NOT_IMPLEMENTED, "No code"),
	INCORRECT_CURRENT_PASSWORD(300, HttpStatus.BAD_REQUEST, "Current password is incorrect"),
	NEW_PASSWORD_DOES_NOT_MATCH(301, HttpStatus.BAD_REQUEST, "THe new password does not match"),
	ACCOUNT_LOCKED(302, HttpStatus.FORBIDDEN, "User account is locked"),
	ACCOUNT_DISABLED(303, HttpStatus.FORBIDDEN, "User account is disabled"),
	BAD_CREDENTIALS(304, HttpStatus.FORBIDDEN, "The username/password is incorrect");

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
