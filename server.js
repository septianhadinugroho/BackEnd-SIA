const Hapi = require('@hapi/hapi');
require('dotenv').config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['http://localhost:5173'], // Izinkan origin frontend
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        additionalHeaders: ['X-Requested-With'],
        exposedHeaders: ['Content-Disposition'],
        credentials: true, // Izinkan kredensial
      },
    },
  });

  // Tambahkan log untuk memastikan server dimulai
  console.log('Memulai server pada port:', process.env.PORT || 3000);

  // Register plugins
  try {
    console.log('Mendaftarkan plugin...');
    await server.register([
      require('./plugins/jwt'),
      require('./plugins/supabase'),
    ]);
    console.log('Plugin berhasil didaftarkan');
  } catch (err) {
    console.error('Gagal mendaftarkan plugin:', err);
    throw err;
  }

  // Tambahkan rute root untuk menunjukkan server berjalan
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.response({
        status: 'success',
        message: 'API Satu Data Mahasiswa sedang berjalan! Gunakan endpoint seperti /auth/login, /mahasiswa/dashboard, dll.',
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
      auth: false, // Tidak memerlukan autentikasi untuk root
      description: 'Rute root untuk memeriksa status server',
      tags: ['api'],
    },
  });

  // Register routes
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

  // Tambahkan log untuk setiap permintaan
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