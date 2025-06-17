const Joi = require('joi');
const { login, register, verifyToken } = require('../handlers/auth');;

module.exports = [
  {
    method: 'POST',
    path: '/auth/login',
    handler: login,
    options: {
      auth: false,
      validate: {
        payload: Joi.object({
          identifier: Joi.string().required(),
          password: Joi.string().required(),
        }),
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
            statusCode: 400,
          }).code(400).takeover();
        },
      },
      description: 'Login pengguna',
      tags: ['api', 'auth'],
    },
  },
  {
    method: 'POST',
    path: '/auth/register',
    handler: register,
    options: {
      auth: false,
      validate: {
        payload: Joi.object({
          identifier: Joi.string().max(50).required(),
          email: Joi.string().email().max(255).required(),
          password: Joi.string().min(6).required(),
          role: Joi.string().valid('mahasiswa', 'admin', 'pemangku_kebijakan').required(),
          nama_lengkap: Joi.string().max(255).required(), // Tambah nama_lengkap
        }),
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
            statusCode: 400,
          }).code(400).takeover();
        },
      },
      description: 'Registrasi pengguna baru',
      tags: ['api', 'auth'],
    },
  },
  {
    method: 'GET',
    path: '/auth/verify',
    handler: verifyToken, // Pastikan handler ini diimpor dari handlers/auth
    options: {
      auth: 'jwt', // Middleware JWT, tanpa scope biar semua role bisa akses
      description: 'Verifikasi token JWT dan kembalikan data user',
      tags: ['api', 'auth'],
    },
  },
];