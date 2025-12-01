package com.mako.config

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

/**
 * Global exception handler for REST controllers.
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationExceptions(
        ex: MethodArgumentNotValidException
    ): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.allErrors.associate { error ->
            val fieldName = (error as FieldError).field
            val message = error.defaultMessage ?: "Invalid value"
            fieldName to message
        }

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Validation Failed",
                    message = "Invalid request data",
                    details = errors
                )
            )
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(
        ex: IllegalArgumentException
    ): ResponseEntity<ErrorResponse> {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Bad Request",
                    message = ex.message ?: "Invalid request"
                )
            )
    }

    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentials(
        ex: BadCredentialsException
    ): ResponseEntity<ErrorResponse> {
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(
                ErrorResponse(
                    status = HttpStatus.UNAUTHORIZED.value(),
                    error = "Unauthorized",
                    message = "Invalid email or password"
                )
            )
    }

    @ExceptionHandler(UsernameNotFoundException::class)
    fun handleUserNotFound(
        ex: UsernameNotFoundException
    ): ResponseEntity<ErrorResponse> {
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(
                ErrorResponse(
                    status = HttpStatus.UNAUTHORIZED.value(),
                    error = "Unauthorized",
                    message = ex.message ?: "User not found"
                )
            )
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(
        ex: AccessDeniedException
    ): ResponseEntity<ErrorResponse> {
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(
                ErrorResponse(
                    status = HttpStatus.FORBIDDEN.value(),
                    error = "Forbidden",
                    message = "Access denied"
                )
            )
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception
    ): ResponseEntity<ErrorResponse> {
        logger.error("Unhandled exception", ex)

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                ErrorResponse(
                    status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    error = "Internal Server Error",
                    message = "An unexpected error occurred"
                )
            )
    }
}

/**
 * Standard error response format.
 */
data class ErrorResponse(
    val status: Int,
    val error: String,
    val message: String,
    val timestamp: String = Instant.now().toString(),
    val details: Map<String, String>? = null
)

