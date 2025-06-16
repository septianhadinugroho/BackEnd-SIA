const Joi = require('joi');
const { 
  createUser, 
  updateUser, 
  deleteUser, 
  getUsers, 
  manageKeuangan, 
  updateKeuangan, 
  manageHakAkses, 
  manageAkademik, 
  exportData 
} = require('../handlers/admin');
const schemas = require('../schemas/admin');

module.exports = [
  {
    method: 'POST',
    path: '/admin/user',
    handler: createUser,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        payload: schemas.user,
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Membuat pengguna baru (mahasiswa, admin, atau pemangku kebijakan)',
      tags: ['api', 'admin'],
    },
  },
  {
    method: 'PUT',
    path: '/admin/user/{userId}',
    handler: updateUser,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        params: Joi.object({
          userId: Joi.string().uuid().required(),
        }),
        payload: schemas.user,
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Memperbarui data pengguna',
      tags: ['api', 'admin'],
    },
  },
  {
    method: 'DELETE',
    path: '/admin/user/{userId}',
    handler: deleteUser,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        params: Joi.object({
          userId: Joi.string().uuid().required(),
        }),
      },
      description: 'Menghapus pengguna',
      tags: ['api', 'admin'],
    },
  },
  {
    method: 'GET',
    path: '/admin/users',
    handler: getUsers,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        query: Joi.object({
          role: Joi.string().valid('mahasiswa', 'admin', 'pemangku_kebijakan').optional(),
          keyword: Joi.string().max(100).optional(),
        }),
      },
      description: 'Mengambil daftar pengguna dengan filter role dan keyword',
      tags: ['api', 'admin'],
    },
  },
  {
    method: 'POST',
    path: '/admin/keuangan',
    handler: manageKeuangan,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        payload: schemas.keuangan,
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Menambahkan data tagihan keuangan',
      tags: ['api', 'admin'],
    },
  },
  {
    method: 'PUT',
    path: '/admin/keuangan/{keuanganId}',
    handler: updateKeuangan,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        params: Joi.object({
          keuanganId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          status: Joi.string().valid('belum_bayar', 'menunggu_verifikasi', 'lunas').required(),
          tanggal_bayar: Joi.date().optional(),
        }),
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Memperbarui status tagihan keuangan',
      tags: ['api', 'admin'],
    },
  },
  {
    method: 'POST',
    path: '/admin/hak-akses',
    handler: manageHakAkses,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        payload: schemas.hak_akses,
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Mengelola hak akses pengguna',
      tags: ['api', 'admin'],
    },
  },
  {
    method: 'POST',
    path: '/admin/akademik',
    handler: manageAkademik,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        payload: Joi.object({
          user_id: Joi.string().uuid().required(),
          semester: Joi.number().integer().required(),
          tahun_akademik: Joi.string().pattern(/^[0-9]{4}\/[0-9]{4}$/).required(),
          mata_kuliah: Joi.array().items(
            Joi.object({
              kode: Joi.string().required(),
              nama: Joi.string().required(),
              sks: Joi.number().integer().required(),
              nilai: Joi.string().optional(),
            })
          ).required(),
          total_sks: Joi.number().integer().optional(),
          ip_semester: Joi.number().precision(2).optional(),
          type: Joi.string().valid('krs', 'khs').required(),
        }),
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Mengelola data akademik (KRS/KHS)',
      tags: ['api', 'admin'],
    },
  },
  {
    method: 'GET',
    path: '/admin/export',
    handler: exportData,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin'],
      },
      validate: {
        query: Joi.object({
          modul: Joi.string().valid('mahasiswa', 'keuangan').required(),
        }),
      },
      description: 'Mengekspor data mahasiswa atau keuangan ke Excel',
      tags: ['api', 'admin'],
    },
  },
];