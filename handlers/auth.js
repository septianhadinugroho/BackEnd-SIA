const { response } = require('../utils/response');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
  login: async (request, h) => {
    const { supabase } = request.server;
    const { identifier, password } = request.payload;

    // Cek user berdasarkan email atau identifier
    const { data: user, error } = await supabase
      .from('profiles')
      .select('user_id, email, password, role')
      .or(`email.eq.${identifier},user_id.eq.${identifier}`)
      .single();

    if (error || !user) {
      return response.error(h, 'Email/ID atau password salah', 401);
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return response.error(h, 'Email/ID atau password salah', 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return response.success(h, {
      user_id: user.user_id,
      role: user.role,
      token,
    });
  },

  register: async (request, h) => {
    const { supabase } = request.server;
    const { identifier, email, password, role } = request.payload;

    // Cek apakah email atau identifier udah ada
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('user_id')
      .or(`email.eq.${email},user_id.eq.${identifier}`)
      .single();

    if (existingUser) {
      return response.error(h, 'Email atau ID sudah terdaftar', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert({
        user_id: identifier || uuidv4(), // Pakai identifier atau generate UUID
        email,
        password: hashedPassword,
        role,
        nama_lengkap: 'Nama Placeholder', // Ganti kalau FE kirim nama
      })
      .select('user_id, role')
      .single();

    if (error) {
      return response.error(h, 'Gagal mendaftar', 500);
    }

    return response.success(h, {}, 'Registrasi berhasil', 201);
  },
};