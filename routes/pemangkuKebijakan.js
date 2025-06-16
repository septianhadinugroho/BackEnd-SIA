const Joi = require('joi');
const { 
  getDashboard, 
  searchData, 
  getLaporan, 
  createLaporan, 
  exportLaporan 
} = require('../handlers/pemangkuKebijakan');
const schemas = require('../schemas/pemangkuKebijakan');

module.exports = [
  {
    method: 'GET',
    path: '/pemangku_kebijakan/dashboard',
    handler: getDashboard,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['pemangku_kebijakan'],
      },
      description: 'Mengambil data dashboard eksklusif pemangku kebijakan',
      tags: ['api', 'pemangku_kebijakan'],
    },
  },
  {
    method: 'GET',
    path: '/pemangku_kebijakan/search',
    handler: searchData,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['pemangku_kebijakan'],
      },
      validate: {
        query: schemas.filter,
      },
      description: 'Mencari dan memfilter data mahasiswa',
      tags: ['api', 'pemangku_kebijakan'],
    },
  },
  {
    method: 'GET',
    path: '/pemangku_kebijakan/laporan/{id}',
    handler: getLaporan,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['pemangku_kebijakan'],
      },
      validate: {
        params: Joi.object({
          id: Joi.string().uuid().required(),
        }),
      },
      description: 'Mengambil detail laporan kinerja akademik',
      tags: ['api', 'pemangku_kebijakan'],
    },
  },
  {
    method: 'POST',
    path: '/pemangku_kebijakan/laporan',
    handler: createLaporan,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['pemangku_kebijakan'],
      },
      validate: {
        payload: Joi.object({
          judul: Joi.string().max(255).required(),
          data: Joi.array().items(Joi.object()).required(),
        }),
        failAction: (request, h, err) => {
          return h.response({
            status: 'error',
            message: 'Validasi gagal: ' + err.message,
          }).code(400).takeover();
        },
      },
      description: 'Membuat laporan kinerja akademik baru',
      tags: ['api', 'pemangku_kebijakan'],
    },
  },
  {
    method: 'GET',
    path: '/pemangku_kebijakan/laporan/{id}/export',
    handler: exportLaporan,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['pemangku_kebijakan'],
      },
      validate: {
        params: Joi.object({
          id: Joi.string().uuid().required(),
        }),
      },
      description: 'Mengekspor laporan ke format Excel',
      tags: ['api', 'pemangku_kebijakan'],
    },
  },
];