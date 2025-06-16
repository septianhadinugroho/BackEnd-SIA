const Joi = require('joi');

module.exports = {
  profile: Joi.object({
    nama_lengkap: Joi.string().required(),
    fakultas: Joi.string().required().max(100),
    skema: Joi.string().required().max(100),
    angkatan: Joi.number().integer().required(),
    telepon: Joi.string().required().max(20),
    alamat: Joi.string().optional().allow(''),
  }),
  krs: Joi.object({
    semester: Joi.number().integer().required(),
    tahun_ajaran: Joi.string().pattern(/^[0-9]{4}\/[0-9]{4}$/).required(),
    mata_kuliah: Joi.array().items(
      Joi.object({
        kode: Joi.string().required(),
        nama: Joi.string().required(),
        sks: Joi.number().integer().required(),
      })
    ).required(),
    total_sks: Joi.number().integer().required(),
  }),
  permohonan: Joi.object({
    jenis: Joi.string().required().max(50),
    keterangan: Joi.string().optional().allow(''),
  }),
};