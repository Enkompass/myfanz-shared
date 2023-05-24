const successResponse = (data, msg) => {
  return {
    success: true,
    status: 200,
    message: msg || 'Successfully processed.',
    data,
  };
};

module.exports = {
  successResponse,
};
