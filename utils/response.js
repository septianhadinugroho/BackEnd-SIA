module.exports = {
  success: (data = null, message = 'Request successful') => ({
    status: 'success',
    message,
    data,
  }),
  error: (message = 'An error occurred', statusCode = 500) => ({
    status: 'error',
    message,
    statusCode,
  }),
};