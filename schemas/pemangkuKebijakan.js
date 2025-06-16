const Joi = require('joi');

module.exports = {
  filter: Joi.object({
    keyword: Joi.string().optional().max(100),
    fakultas: Joi.string().optional().max(100),
    tahun_akademik: Joi.string().pattern(/^[0-9]{4}\/[0-9]{4}$/).optional(),
    semester: Joi.number().integer().optional(),
  }),
};