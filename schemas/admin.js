const Joi = require('joi');

module.exports = {
  user: Joi.object({
    identifier: Joi.string().required().max(50),
    email: Joi.string().email().required(),
    role: Joi.string().valid('mahasiswa', 'admin', 'pemangku_kebijakan').required(),
  }),
  hak_akses: Joi.object({
    modul: Joi.string().required().max(50),
    izin: Joi.object({
      read: Joi.boolean().required(),
      write: Joi.boolean().required(),
      delete: Joi.boolean().required(),
    }).required(),
  }),
  keuangan: Joi.object({
    user_id: Joi.string().uuid().required(),
    jenis: Joi.string().required().max(50),
    jumlah: Joi.number().required(),
    tanggal_jat_tempo: Joi.date().optional(),
  }),
};