const Joi = require('joi');

module.exports = {
  login: Joi.object({
    identifier: Joi.string().required().max(50),
    password: Joi.string().required().min(6),
  }),
  register: Joi.object({
    identifier: Joi.string().required().max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('mahasiswa', 'admin', 'pemangku_kebijakan').required(),
  }),
};