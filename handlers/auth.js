const response = require('../utils/response');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
  login: async (request, h) => {
    const { supabase } = request.server;
    const { identifier, password } = request.payload;

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, identifier, email, password, role')
        .or(`identifier.eq.${identifier},email.eq.${identifier}`)
        .single();

      if (userError || !user) {
        if (userError) console.error('Supabase Login Error:', userError);
        return response.error(h, 'Email/ID atau password salah', 401);
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return response.error(h, 'Email/ID atau password salah', 401);
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return response.success(h, {
        user_id: user.id,
        role: user.role,
        token,
      });
    } catch (err) {
      console.error('Login Error:', err);
      return response.error(h, `Gagal login: ${err.message}`, 500);
    }
  },

  register: async (request, h) => {
    const { supabase } = request.server;
    const { identifier, email, password, role, nama_lengkap } = request.payload;

    try {
      console.log('Register payload:', { identifier, email, role, nama_lengkap }); // Debug

      // Cek duplikat
      const { data: existingUser, error: checkUserError } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},identifier.eq.${identifier}`)
        .single();

      if (checkUserError && checkUserError.code !== 'PGRST116') {
        console.error('Supabase Check User Error:', checkUserError);
        return response.error(h, 'Gagal memeriksa user', 500);
      }
      if (existingUser) {
        return response.error(h, 'Email atau ID sudah terdaftar', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Password hashed'); // Debug

      // Insert ke users
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

      if (insertUserError) {
        console.error('Supabase Insert User Error:', insertUserError);
        return response.error(h, 'Gagal mendaftar pengguna', 500);
      }
      console.log('User inserted:', newUser); // Debug

      // Insert ke profiles
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

      if (insertProfileError) {
        console.error('Supabase Insert Profile Error:', insertProfileError);
        await supabase.from('users').delete().eq('id', newUser.id); // Rollback
        return response.error(h, `Gagal mendaftar profil: ${insertProfileError.message}`, 500);
      }
      console.log('Profile inserted:', newProfile); // Debug

      // Kirim response
      const responseData = { user_id: newUser.id, role: newUser.role };
      console.log('Sending success response:', responseData); // Debug
      return response.success(h, responseData, 'Registrasi berhasil', 201);
    } catch (err) {
      console.error('Register Error:', err.stack); // Log stack trace
      return response.error(h, `Gagal registrasi: ${err.message}`, 500);
    }
  },
};