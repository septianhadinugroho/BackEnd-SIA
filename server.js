const Hapi = require('@hapi/hapi');
require('dotenv').config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['http://localhost:5173'],
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        additionalHeaders: ['X-Requested-With'],
        exposedHeaders: ['Content-Disposition'],
        credentials: true,
      },
    },
  });

  console.log('Memulai server pada port:', process.env.PORT || 3000);

  // Global error handling
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    if (response.isBoom) {
      console.error('Request Error:', {
        method: request.method,
        path: request.path,
        error: response.output.payload,
        stack: response.stack,
      });
      return h.response({
        status: 'error',
        message: response.message || 'An internal server error occurred',
        statusCode: response.output.statusCode,
      }).code(response.output.statusCode);
    }
    return h.continue;
  });

  try {
    console.log('Mendaftarkan plugin...');
    await server.register([
      require('./plugins/jwt'),
      require('./plugins/supabase'),
    ]);
    console.log('Plugin JWT config:', server.auth.strategies);
    console.log('Plugin berhasil didaftarkan');
  } catch (err) {
    console.error('Gagal mendaftarkan plugin:', err);
    throw err;
  }

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.response({
        status: 'success',
        message: 'API Satu Data Mahasiswa sedang berjalan! Gunakan endpoint seperti /auth/login, /auth/register, dll.',
        version: '1.0.0',
        availableEndpoints: [
          '/auth/login',
          '/auth/register',
          '/mahasiswa/dashboard',
          '/admin/users',
          '/pemangku_kebijakan/dashboard',
        ],
      }).code(200);
    },
    options: {
      auth: false,
      description: 'Rute root untuk memeriksa status server',
      tags: ['api'],
    },
  });

  try {
    console.log('Memuat rute...');
    server.route([
      ...require('./routes/auth'),
      ...require('./routes/mahasiswa'),
      ...require('./routes/admin'),
      ...require('./routes/pemangkuKebijakan'),
    ]);
    console.log('Rute berhasil dimuat');
  } catch (err) {
    console.error('Gagal memuat rute:', err);
    throw err;
  }

  server.ext('onRequest', (request, h) => {
    console.log(`[${new Date().toISOString()}] ${request.method.toUpperCase()} ${request.path}`);
    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan di ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

init();