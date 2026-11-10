package hu.elte.ik.thesis.cinegrade.handler;

import lombok.Getter;

/**
 * Throw this from a service when a rule fails. GlobalExceptionHandler turns it into
 * the HTTP status and message set on the BusinessErrorCodes value.
 */
@Getter
public class BusinessException extends RuntimeException {

	private final BusinessErrorCodes errorCode;

	public BusinessException(BusinessErrorCodes errorCode) {
		super(errorCode.getDescription());
		this.errorCode = errorCode;
	}
}
