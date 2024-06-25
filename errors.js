const { ValidationError: JoiValidationError } = require('joi');

class ConflictError extends Error {
  constructor(args) {
    super(args);
    this.name = 'ConflictError';
  }
}

class WrongUrlError extends Error {
  constructor(args) {
    super(args);
    this.name = 'WrongUrlError';
  }
}

class NotFoundError extends Error {
  constructor(args) {
    super(args);
    this.name = 'NotFoundError';
  }
}

class NotAuthorizedError extends Error {
  constructor(args) {
    super(args);
    this.name = 'NotAuthorizedError';
  }
}

class JwtExpiredError extends Error {
  constructor(args) {
    super(args);
    this.name = 'JwtExpiredError';
  }
}

class TwoFactorError extends Error {
  constructor(args) {
    super(args);
    this.name = 'TwoFactorError';
    this.message = args.message;
    this.twoFactorType = args.twoFactorType;
    this.token = args.token;
  }
}

class TrustFlowError extends Error {
  constructor(args) {
    super(args);
    this.name = 'TrustFlowError';
    this.message = args.message;
    // this.type = args.type;
    // this.verificationType = args.twoFactorType;
  }
}

class PermissionError extends Error {
  constructor(args) {
    super(args);
    this.name = 'PermissionError';
  }
}

class ValidationError extends JoiValidationError {
  constructor(message, label, value = undefined, type = 'custom_validation') {
    super(
      message,
      [
        {
          message,
          path: [label],
          type: type || 'custom',
          context: {
            label,
            key: label,
            value,
          },
        },
      ],
      {}
    );
  }
}

class ResetContentError extends Error {
  constructor(args) {
    super(args);
    this.name = 'ResetContentError';
    this.message = args.message;
    this.data = args.data;
  }
}

module.exports = {
  ConflictError,
  WrongUrlError,
  NotFoundError,
  NotAuthorizedError,
  JwtExpiredError,
  ValidationError,
  PermissionError,
  TwoFactorError,
  TrustFlowError,
  ResetContentError,
};
