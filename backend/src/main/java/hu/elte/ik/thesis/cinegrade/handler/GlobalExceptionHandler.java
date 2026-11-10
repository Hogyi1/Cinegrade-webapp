package hu.elte.ik.thesis.cinegrade.handler;

import java.util.HashSet;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;

//@Hidden
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ExceptionResponse> handleException(BusinessException e) {
		BusinessErrorCodes code = e.getErrorCode();
		return ResponseEntity.status(code.getHttpStatus())
				.body(ExceptionResponse.builder().businessErrorCode(code.getCode())
						.businessErrorDescription(code.getDescription()).error(code.getDescription()).build());
	}

	// Safety net: two requests can pass the "is it taken" check at the same moment.
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ExceptionResponse> handleException(DataIntegrityViolationException e) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(ExceptionResponse.builder().error("That conflicts with data that already exists").build());
	}

	@ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class })
	public ResponseEntity<ExceptionResponse> handleBadRequest(Exception e) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ExceptionResponse.builder().error("The request is missing data or has the wrong format").build());
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ExceptionResponse> handleException(AccessDeniedException e) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(ExceptionResponse.builder().error("You don't have permission to do that").build());
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ExceptionResponse> handleException(MaxUploadSizeExceededException e) {
		return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
				.body(ExceptionResponse.builder().error("That file is too large. The limit is 50 MB").build());
	}

	@ExceptionHandler(LockedException.class)
	public ResponseEntity<ExceptionResponse> handleException(LockedException e) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(ExceptionResponse.builder().businessErrorCode(BusinessErrorCodes.ACCOUNT_LOCKED.getCode())
						.businessErrorDescription(BusinessErrorCodes.ACCOUNT_LOCKED.getDescription())
						.error(e.getMessage()).build());
	}

	@ExceptionHandler(DisabledException.class)
	public ResponseEntity<ExceptionResponse> handleException(DisabledException e) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(ExceptionResponse.builder().businessErrorCode(BusinessErrorCodes.ACCOUNT_DISABLED.getCode())
						.businessErrorDescription(BusinessErrorCodes.ACCOUNT_DISABLED.getDescription())
						.error(e.getMessage()).build());
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ExceptionResponse> handleException(BadCredentialsException e) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(ExceptionResponse.builder().businessErrorCode(BusinessErrorCodes.BAD_CREDENTIALS.getCode())
						.businessErrorDescription(BusinessErrorCodes.BAD_CREDENTIALS.getDescription())
						.error(BusinessErrorCodes.BAD_CREDENTIALS.getDescription()).build());
	}

	@ExceptionHandler(MessagingException.class)
	public ResponseEntity<ExceptionResponse> handleException(MessagingException e) {
		log.error("Could not send email", e);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ExceptionResponse.builder().error("We couldn't send the email. Try again in a moment").build());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ExceptionResponse> handleException(MethodArgumentNotValidException e) {

		Set<String> errors = new HashSet<>();
		e.getBindingResult().getAllErrors().forEach(error -> {
			var errorMsg = error.getDefaultMessage();
			errors.add(errorMsg);
		});
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ExceptionResponse.builder().validationErrors(errors).build());
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ExceptionResponse> handleException(Exception e) {
		// Spring's own errors (404, 405, missing parameter) already know their status.
		if (e instanceof ErrorResponse springError) {
			return ResponseEntity.status(springError.getStatusCode())
					.body(ExceptionResponse.builder().error(springError.getBody().getDetail()).build());
		}

		// The details go to the log only, so internals never reach the browser.
		log.error("Unhandled error", e);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ExceptionResponse.builder()
				.businessErrorDescription("Internal error, contact the admin").build());
	}

}
