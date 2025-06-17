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
        maxAgeSec: 604800
      },
      validate: async (artifacts, request, h) => {
        const { id, role, scope } = artifacts.decoded.payload;
        const { supabase } = request.server;
        console.log('Decoded payload:', { id, role, scope });

        const { data: user, error } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          return { isValid: false };
        }
        if (!user) {
          console.log('User not found for id:', id);
          return { isValid: false };
        }

        console.log('Database user:', user);
        return {
          isValid: true,
          credentials: { id: user.id, role: user.role || role },
        };
      },
    });
  },
};