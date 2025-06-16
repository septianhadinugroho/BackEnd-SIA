const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const response = require('../utils/response');

const login = async (request, h) => {
  const { identifier, password } = request.payload;
  const { supabase } = request.server;

  // Cari pengguna berdasarkan identifier
  const { data: user, error } = await supabase
    .from('users')
    .select('id, identifier, password, role')
    .eq('identifier', identifier)
    .single();

  if (error || !user) {
    return h.response(response.error('Identifikasi atau kata sandi salah', 401)).code(401);
  }

  // Verifikasi password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return h.response(response.error('Identifikasi atau kata sandi salah', 401)).code(401);
  }

  // Buat token JWT
  const token = request.server.methods.jwt.sign({
    userId: user.id,
    role: user.role,
  });

  return h.response(response.success({ token }, 'Login berhasil')).code(200);
};

const register = async (request, h) => {
  const { identifier, email, password, role } = request.payload;
  const { supabase } = request.server;

  // Validasi role
  if (!['mahasiswa', 'admin', 'pemangku_kebijakan'].includes(role)) {
    return h.response(response.error('Role tidak valid', 400)).code(400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Simpan ke database
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: uuidv4(),
      identifier,
      email,
      password: hashedPassword,
      role,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return h.response(response.error('Identifier atau email sudah digunakan', 400)).code(400);
    }
    console.error('Supabase error:', error);
    return h.response(response.error('Gagal mendaftar pengguna', 500)).code(500);
  }

  return h.response(response.success({ user_id: data.id }, 'Registrasi berhasil')).code(201);
};

module.exports = { login, register };