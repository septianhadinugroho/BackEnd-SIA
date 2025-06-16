const Hapi = require('@hapi/hapi');
// const Jwt = require('jsonwebtoken'); // HAPUS ATAU KOMEN BARIS INI
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const policyMakerRoutes = require('./routes/policyMakerRoutes');

dotenv.config();

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT,
        host: 'localhost',
        routes: {
            cors: {
                origin: ['http://localhost:5173'], // Izinkan origin frontend Anda
                headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'], // Header yang diizinkan
                additionalHeaders: ['X-Requested-With'], // Header tambahan jika ada
                exposedHeaders: ['Content-Disposition'], // Header yang diekspos ke browser
                credentials: true // Izinkan kredensial (cookies, authorization headers)
            }
        }
    });

  // Initialize Supabase
  server.app.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  await server.register(require('@hapi/jwt'));

  server.auth.strategy('jwt', 'jwt', {
    keys: process.env.JWT_SECRET,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 86400 // 1 day
    },
    validate: async (artifacts, request, h) => {
      const { data, error } = await server.app.supabase
        .from('users')
        .select('id, role')
        .eq('id', artifacts.decoded.payload.userId)
        .single();

      if (error) {
        return { isValid: false };
      }

      return {
        isValid: true,
        credentials: {
          userId: data.id,
          role: data.role,
          scope: [data.role] // Add role as scope
        }
      };
    }
  });

  server.route([
    ...authRoutes,
    ...studentRoutes,
    ...adminRoutes,
    ...policyMakerRoutes
  ]);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();