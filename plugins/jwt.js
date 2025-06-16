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
          .from('profiles')
          .select('user_id, role')
          .eq('user_id', id)
          .single();

        if (error || !user) {
          return { isValid: false };
        }

        return {
          isValid: true,
          credentials: { id: user.user_id, role: user.role || role },
        };
      },
    });
  },
};