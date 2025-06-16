const Joi = require('joi');
const { 
  getDashboard, 
  getProfile, 
  updateProfile, 
  getKrs, 
  getKhs, 
  getKeuangan, 
  submitPermohonan, 
  getNotifikasi, 
  markNotifikasiRead,
  verifyToken
} = require('../handlers/mahasiswa');
const schemas = require('../schemas/mahasiswa');

module.exports = [
  {
    method: 'GET',
    path: '/mahasiswa/dashboard',
    handler: getDashboard,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      description: 'Mengambil data dashboard mahasiswa (profil, KRS, KHS, keuangan, notifikasi)',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'GET',
    path: '/mahasiswa/profile',
    handler: getProfile,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      description: 'Mengambil data profil mahasiswa',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'PUT',
    path: '/mahasiswa/profile',
    handler: updateProfile,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      validate: {
        payload: schemas.profile,
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Memperbarui data profil mahasiswa',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'GET',
    path: '/mahasiswa/krs',
    handler: getKrs,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      validate: {
        query: Joi.object({
          semester: Joi.number().integer().optional(),
          tahun_akademik: Joi.string().pattern(/^[0-9]{4}\/[0-9]{4}$/).optional(),
        }),
      },
      description: 'Mengambil daftar KRS mahasiswa dengan filter semester dan tahun akademik',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'GET',
    path: '/mahasiswa/khs',
    handler: getKhs,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      validate: {
        query: Joi.object({
          semester: Joi.number().integer().optional(),
          tahun_akademik: Joi.string().pattern(/^[0-9]{4}\/[0-9]{4}$/).optional(),
        }),
      },
      description: 'Mengambil daftar KHS mahasiswa dengan filter semester dan tahun akademik',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'GET',
    path: '/mahasiswa/keuangan',
    handler: getKeuangan,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      validate: {
        query: Joi.object({
          status: Joi.string().valid('belum_bayar', 'menunggu_verifikasi', 'lunas').optional(),
        }),
      },
      description: 'Mengambil data keuangan mahasiswa dengan filter status',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'POST',
    path: '/mahasiswa/permohonan',
    handler: submitPermohonan,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      validate: {
        payload: schemas.permohonan,
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Mengajukan permohonan (cuti, beasiswa, dll)',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'GET',
    path: '/mahasiswa/notifikasi',
    handler: getNotifikasi,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      validate: {
        query: Joi.object({
          is_read: Joi.boolean().optional(),
        }),
      },
      description: 'Mengambil daftar notifikasi mahasiswa dengan filter status baca',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'PATCH',
    path: '/mahasiswa/notifikasi/{notifikasiId}',
    handler: markNotifikasiRead,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['mahasiswa'],
      },
      validate: {
        params: Joi.object({
          notifikasiId: Joi.string().uuid().required(),
        }),
      },
      description: 'Menandai notifikasi sebagai dibaca',
      tags: ['api', 'mahasiswa'],
    },
  },
  {
    method: 'GET',
    path: '/auth/verify',
    handler: verifyToken,
    options: {
      auth: 'jwt', // Middleware JWT, tanpa scope biar semua role bisa akses
      description: 'Verifikasi token JWT dan kembalikan data user',
      tags: ['api', 'auth'],
    },
  },
];