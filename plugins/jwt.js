const Jwt = require('@hapi/jwt');
require('dotenv').config();

module.exports = {
  name: 'jwtAuth',
  version: '1.0.0',
  register: async (server) => {
    // Daftarkan plugin JWT
    await server.register(Jwt);

    // Definisikan strategi autentikasi JWT
    server.auth.strategy('jwt', 'jwt', {
      keys: process.env.JWT_SECRET, // Gunakan JWT_SECRET dari .env
      verify: {
        aud: false,
        iss: false,
        sub: false,
        nbf: true,
        exp: true,
        maxAgeSec: 604800, // 7 hari (sesuai token expiration di handler)
        timeSkewSec: 15,
      },
      validate: async (artifacts, request, h) => {
        const { supabase } = request.server;
        const { id, role } = artifacts.decoded.payload;

        // Verifikasi pengguna di database
        const { data, error } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', id)
          .single();

        if (error || !data) {
          return { isValid: false };
        }

        // Pastikan role sesuai
        if (data.role !== role) {
          return { isValid: false };
        }

        return {
          isValid: true,
          credentials: { id: data.id, role: data.role },
        };
      },
    });

    // Tetapkan strategi default
    server.auth.default('jwt');
  },
};