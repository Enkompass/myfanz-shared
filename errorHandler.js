const ERRORS = {
    AUTHENTICATION: {
        label: 'AUTHENTICATION',
        status: 401
    },
    VALIDATION: {
        label: 'VALIDATION',
        status: 400
    }
}

class CustomError extends Error {
    data;
    type;
    status;

    constructor(message, data = {}, type = 'GENERAL', status) {
        super(message);
        this.data = data;
        this.status = status;
        this.type = type;
    }
}

class AuthenticationError extends CustomError {
    constructor(message, status, data = {}) {
        super(message, data, ERRORS['AUTHENTICATION'].label, ERRORS['AUTHENTICATION'].status);
    }
}

class ValidationError extends CustomError {
    constructor(message, data = {}) {
        super(message, data, ERRORS['VALIDATION'].label, ERRORS['VALIDATION'].status);
    }
}

function errorHandler(err, req, res, next) {
    return res.status(err.status).json({
        success: false,
        status: err.status,
        message: err.message,
        data: err.data
    });
}

module.exports = {
    AuthenticationError,
    ValidationError,
    errorHandler
}