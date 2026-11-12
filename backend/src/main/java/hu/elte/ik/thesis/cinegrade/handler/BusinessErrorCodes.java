package hu.elte.ik.thesis.cinegrade.handler;

import org.springframework.http.HttpStatus;

import lombok.Getter;

// The frontend checks some of these numbers (login: 302-304, activation: 308-309), so never renumber an existing code.
// New codes go at the end with the next free number.
public enum BusinessErrorCodes {

	NO_CODE(0, HttpStatus.NOT_IMPLEMENTED, "No code"),
	INCORRECT_CURRENT_PASSWORD(300, HttpStatus.BAD_REQUEST, "Current password is incorrect"),
	NEW_PASSWORD_DOES_NOT_MATCH(301, HttpStatus.BAD_REQUEST, "The new passwords do not match"),
	ACCOUNT_LOCKED(302, HttpStatus.FORBIDDEN, "User account is locked"),
	ACCOUNT_DISABLED(303, HttpStatus.FORBIDDEN, "User account is disabled"),
	BAD_CREDENTIALS(304, HttpStatus.FORBIDDEN, "The username/password is incorrect"),
	USERNAME_TAKEN(305, HttpStatus.CONFLICT, "That username is already taken"),
	EMAIL_TAKEN(306, HttpStatus.CONFLICT, "That email is already registered"),
	INVALID_ACTIVATION_CODE(307, HttpStatus.BAD_REQUEST, "That activation code is not valid"),
	ACTIVATION_CODE_EXPIRED(308, HttpStatus.BAD_REQUEST, "That activation code has expired. We sent a new one to your email"),
	ACTIVATION_ATTEMPTS_EXCEEDED(309, HttpStatus.BAD_REQUEST, "You have exceeded the maximum number of activation attempts"),
	FAILED_TO_SEND_VALIDATION_EMAIL(310, HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send validation email"),
	INVALID_SESSION(311, HttpStatus.UNAUTHORIZED, "Invalid session"),
	INVALID_FILE(312, HttpStatus.BAD_REQUEST, "Invalid file"),
	USERNAME_CHANGE_TOO_SOON(313, HttpStatus.TOO_MANY_REQUESTS, "You can only change your username once every 3 days"),
	FILE_NOT_FOUND(314, HttpStatus.NOT_FOUND, "That file does not exist"),
	USER_DEACTIVATED(315, HttpStatus.FORBIDDEN, "User account is deactivated"),
	USER_NOT_FOUND(316, HttpStatus.NOT_FOUND, "That user does not exist"),
	CANNOT_RATE_SELF(317, HttpStatus.BAD_REQUEST, "You cannot rate yourself"),
	// The upload failing on our side (disk/IO), not a bad file: that one is INVALID_FILE
	AVATAR_UPLOAD_FAILED(318, HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload avatar"),
	// One message for wrong, used and expired links, so nobody can probe which tokens exist
	INVALID_RESET_LINK(319, HttpStatus.BAD_REQUEST, "This reset link is invalid or has expired"),
	CANNOT_FOLLOW_SELF(320, HttpStatus.BAD_REQUEST, "You cannot follow yourself"),
	// [AI-GENERATED] Posts
	POST_NOT_FOUND(321, HttpStatus.NOT_FOUND, "That post does not exist"),
	NOT_POST_OWNER(322, HttpStatus.FORBIDDEN, "Only the author can change this post"),
	TOO_MANY_TAGS(323, HttpStatus.BAD_REQUEST, "A post can have at most 5 tags"),
	UNKNOWN_TAG(324, HttpStatus.BAD_REQUEST, "One of the tags does not exist"),
	POST_FILE_REQUIRED(325, HttpStatus.BAD_REQUEST, "Add a LUT or a .cgedit file"),
	POST_HAS_NO_SUCH_FILE(326, HttpStatus.NOT_FOUND, "This post has no file of that kind"),
	FILE_UPLOAD_FAILED(327, HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload file");

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
