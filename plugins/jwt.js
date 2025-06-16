const Jwt = require('@hapi/jwt');

exports.plugin = {
  name: 'jwt-auth',
  register: async (server, options) => {
    await server.register(Jwt);

    server.auth.strategy('jwt', 'jwt', {
      keys: process.env.JWT_SECRET,
      verify: {
        aud: false,
        iss: false,
        sub: false,
        maxAgeSec: 86400, // 1 hari
      },
      validate: async (artifacts, request, h) => {
        const { id, role } = artifacts.decoded.payload;
        const { supabase } = request.server;

        const { data: user, error } = await supabase
          .from('users') // Ganti ke tabel users
          .select('id, role')
          .eq('id', id)
          .single();

        if (error || !user) {
          console.error('JWT Validation Error:', error);
          return { isValid: false };
        }

        return {
          isValid: true,
          credentials: { id: user.id, role: user.role || role },
        };
      },
    });
  },
};