module.exports = {
  success: (h, data = {}, message = 'Request successful', code = 200) => {
    try {
      return h.response({
        status: 'success',
        message,
        data,
      }).code(code);
    } catch (err) {
      console.error('Response Success Error:', err);
      return h.response({
        status: 'error',
        message: 'Failed to format success response',
        statusCode: 500,
      }).code(500);
    }
  },
  error: (h, message, code = 400) => {
    try {
      return h.response({
        status: 'error',
        message,
        statusCode: code,
      }).code(code);
    } catch (err) {
      console.error('Response Error Error:', err);
      return h.response({
        status: 'error',
        message: 'Failed to format error response',
        statusCode: 500,
      }).code(500);
    }
  },
};