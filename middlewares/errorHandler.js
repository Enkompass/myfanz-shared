const { WrongUrlError } = require('../errors');

exports.wrongUrl = function () {
  throw new WrongUrlError('Wrong API URL');
};

exports.errorHandler = function (err, req, res, next) {
  // const statusCode = 500;
  let responseValue = {
    success: false,
    message: err.message || 'Something went wrong',
  };

  const errors = {};

  console.log('errorHandler err ', err);

  switch (err.name) {
    case 'ValidationError':
      responseValue.code = 400;
      err.details &&
        err.details.map((i) => {
          errors[i.context.label] = i.message;
        });

      responseValue.errors = errors;
      delete responseValue.message;
      break;
    case 'JwtExpiredError':
      responseValue.code = 401;
      break;
    case 'PermissionError':
      responseValue.code = 403;
      break;
    case 'NotFoundError':
      responseValue.code = 404;
      break;
    case 'InvalidCsrfError':
      responseValue.code = 422;
      break;
    case 'NotAcceptableError':
      responseValue.code = 406;
      responseValue.message = err.message;
      responseValue.data = err.data;
      break;
    case 'ConflictError':
      responseValue.code = 409;
      break;
    case 'TwoFactorError':
      responseValue.code = 412;
      responseValue.message = err.message;
      responseValue.twoFactorType = err.twoFactorType;
      responseValue.token = err.token;
      break;
    case 'TrustFlowError':
      responseValue.code = 413;
      responseValue.message = err.message;
      // responseValue.type = err.type;
      break;
    case 'NotAuthorizedError':
      responseValue.code = 419;
      break;
    case 'WrongUrlError':
      responseValue.code = 501;
      break;
    default:
      responseValue.code = 500;
      break;
  }

  res.status(responseValue.code);
  res.json(responseValue);
  next(err);
};
