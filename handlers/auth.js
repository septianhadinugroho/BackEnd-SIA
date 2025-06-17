const response = require('../utils/response');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
  login: async (request, h) => {
    const { supabase } = request.server;
    const { identifier, password } = request.payload;

    try {
      // Mengambil data user dari database berdasarkan identifier (email atau ID)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, identifier, email, password, role')
        .or(`identifier.eq.${identifier},email.eq.${identifier}`)
        .single();

      // Menangani error jika user tidak ditemukan atau ada masalah database
      if (userError || !user) {
        if (userError) console.error('Supabase Login Error:', userError);
        return response.error(h, 'Email/ID atau password salah', 401);
      }

      // Memverifikasi password yang diberikan dengan password yang di-hash di database
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return response.error(h, 'Email/ID atau password salah', 401);
      }

      // Membuat token JWT
      // Payload token mencakup ID pengguna, peran, dan SANGAT PENTING: scope dalam bentuk array
      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          scope: [user.role] // Pastikan 'scope' adalah properti yang berisi ARRAY dari peran
        },
        process.env.JWT_SECRET, // Menggunakan secret key dari environment variables
        { expiresIn: '1d' } // Token akan kedaluwarsa dalam 1 hari
      );

      // Mengembalikan respons sukses dengan ID pengguna, peran, dan token
      return response.success(h, {
        user_id: user.id,
        role: user.role,
        token,
      });
    } catch (err) {
      // Menangani error tak terduga selama proses login
      console.error('Login Error:', err);
      return response.error(h, `Gagal login: ${err.message}`, 500);
    }
  },

  register: async (request, h) => {
    const { supabase } = request.server;
    const { identifier, email, password, role, nama_lengkap } = request.payload;

    try {
      console.log('Register payload:', { identifier, email, role, nama_lengkap });

      // Memeriksa apakah identifier atau email sudah terdaftar
      const { data: existingUser, error: checkUserError } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},identifier.eq.${identifier}`)
        .single();

      // Menangani error saat memeriksa user, kecuali jika tidak ada user yang ditemukan (PGRST116)
      if (checkUserError && checkUserError.code !== 'PGRST116') {
        console.error('Supabase Check User Error:', checkUserError);
        return response.error(h, 'Gagal memeriksa user', 500);
      }
      // Jika user sudah ada, kembalikan error
      if (existingUser) {
        return response.error(h, 'Email atau ID sudah terdaftar', 409);
      }

      // Menghash password sebelum disimpan ke database
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Password hashed');

      // Membuat UUID baru untuk user_id dan menyisipkan data user ke tabel 'users'
      const userId = uuidv4();
      const { data: newUser, error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          identifier,
          email,
          password: hashedPassword,
          role,
        })
        .select('id, identifier, role')
        .single();

      // Menangani error jika gagal menyisipkan user
      if (insertUserError) {
        console.error('Supabase Insert User Error:', insertUserError);
        return response.error(h, 'Gagal mendaftar pengguna', 500);
      }
      console.log('User inserted:', newUser);

      // Membuat UUID baru untuk profile_id dan menyisipkan data profil ke tabel 'profiles'
      const profileId = uuidv4();
      const { data: newProfile, error: insertProfileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          user_id: newUser.id,
          nama_lengkap,
          fakultas: null,
          jurusan: null,
          angkatan: null,
          telepon: null,
          alamat: null,
        })
        .select('id, user_id')
        .single();

      // Menangani error jika gagal menyisipkan profil, dan melakukan rollback (menghapus user yang baru dibuat)
      if (insertProfileError) {
        console.error('Supabase Insert Profile Error:', insertProfileError);
        await supabase.from('users').delete().eq('id', newUser.id); // Rollback user
        return response.error(h, `Gagal mendaftar profil: ${insertProfileError.message}`, 500);
      }
      console.log('Profile inserted:', newProfile);

      // Mengembalikan respons sukses registrasi
      const responseData = { user_id: newUser.id, role: newUser.role };
      console.log('Sending success response:', responseData);
      return response.success(h, responseData, 'Registrasi berhasil', 201);
    } catch (err) {
      // Menangani error tak terduga selama proses registrasi
      console.error('Register Error:', err.stack);
      return response.error(h, `Gagal registrasi: ${err.message}`, 500);
    }
  },

  verifyToken: async (request, h) => {
    const { supabase } = request.server;
    const { credentials } = request.auth;

    // Jika tidak ada kredensial, berarti token tidak valid atau tidak ada
    if (!credentials) {
      return response.error(h, 'Token tidak valid atau tidak ditemukan', 401);
    }

    // Mendapatkan user ID dan peran dari kredensial yang sudah divalidasi oleh JWT
    const { id: userId, role } = credentials;

    // Opsional: mengambil nama_lengkap dari tabel profiles jika diperlukan untuk respons endpoint ini
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nama_lengkap')
      .eq('user_id', userId)
      .single();

    // Menangani potensi error dari pengambilan profil, mengabaikan 'no rows found' (PGRST116)
    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Supabase Profile Fetch Error (verifyToken):', profileError);
        return response.error(h, 'Gagal mengambil data profil', 500);
    }

    // Mengembalikan respons sukses dengan data user yang diverifikasi
    return response.success(h, {
      user_id: userId,
      role: role, // Menggunakan peran dari kredensial yang sudah divalidasi
      nama_lengkap: profile ? profile.nama_lengkap : null, // Menyertakan nama_lengkap jika profil ditemukan
    });
  },
};