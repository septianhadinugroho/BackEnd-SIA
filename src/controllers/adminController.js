const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

const crudUser = async (request, h) => {
  const { method } = request;
  // Perbaiki: Konversi metode ke huruf kapital untuk perbandingan case-insensitive
  const httpMethod = method.toUpperCase(); // <-- Perubahan di sini!
  console.log(`[crudUser] Menerima metode HTTP: ${httpMethod} untuk path: ${request.path}`);

  const { id, email, password, role, profile } = request.payload;

  if (httpMethod === 'POST') { // <-- Gunakan httpMethod yang sudah diubah
    console.log('[crudUser] Memproses permintaan POST (membuat pengguna baru)');
    if (!email || !password || !role) {
      return h.response({ message: 'Email, password, and role are required' }).code(400);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ email, password: hashedPassword, role, profile })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return h.response({ message: 'Email already exists' }).code(409);
      }
      return h.response({ message: `Error creating user: ${error.message}` }).code(500);
    }
    return h.response(data).code(201);
  }

  if (httpMethod === 'PUT') { // <-- Gunakan httpMethod yang sudah diubah
    console.log('[crudUser] Memproses permintaan PUT (memperbarui pengguna)');
    if (!id) {
      return h.response({ message: 'User ID is required' }).code(400);
    }
    const updates = {};
    if (email) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (role) updates.role = role;
    if (profile) updates.profile = profile;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return h.response({ message: `Error updating user: ${error.message}` }).code(500);
    }
    if (!data) {
      return h.response({ message: 'User not found' }).code(404);
    }
    return h.response(data);
  }

  if (httpMethod === 'DELETE') { // <-- Gunakan httpMethod yang sudah diubah
    console.log('[crudUser] Memproses permintaan DELETE (menghapus pengguna)');
    if (!id) {
      return h.response({ message: 'User ID is required' }).code(400);
    }
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return h.response({ message: `Error deleting user: ${error.message}` }).code(500);
    }
    if (!data) {
      return h.response({ message: 'User not found' }).code(404);
    }
    return h.response({ message: 'User deleted successfully' });
  }

  console.log(`[crudUser] Metode tidak diizinkan atau tidak ditangani: ${httpMethod}`);
  return h.response({ message: 'Method not allowed' }).code(405);
};

const manageAcademic = async (request, h) => {
  const { user_id, semester, krs, khs } = request.payload;

  if (!user_id || !semester) {
    return h.response({ message: 'User ID and semester are required' }).code(400);
  }

  const { data, error } = await supabase
    .from('academic_records')
    .upsert({ user_id, semester, krs, khs })
    .select()
    .single();

  if (error) {
    return h.response({ message: `Error managing academic records: ${error.message}` }).code(500);
  }

  return h.response(data);
};

const manageFinance = async (request, h) => {
  const { user_id, amount, status, due_date } = request.payload;

  if (!user_id || !amount || !status || !due_date) {
    return h.response({ message: 'User ID, amount, status, and due date are required' }).code(400);
  }

  const { data, error } = await supabase
    .from('financial_records')
    .upsert({ user_id, amount, status, due_date })
    .select()
    .single();

  if (error) {
    return h.response({ message: `Error managing financial records: ${error.message}` }).code(500);
  }

  return h.response(data);
};

const exportData = async (request, h) => {
  const { table } = request.query;

  if (!table) {
    return h.response({ message: 'Table name is required' }).code(400);
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .csv();

  if (error) {
    return h.response({ message: `Error exporting data: ${error.message}` }).code(500);
  }

  return h.response(data).header('Content-Type', 'text/csv').header('Content-Disposition', `attachment; filename=${table}.csv`);
};

const manageAccess = async (request, h) => {
  const { user_id, role } = request.payload;

  if (!user_id || !role) {
    return h.response({ message: 'User ID and role are required' }).code(400);
  }

  if (!['student', 'admin', 'policymaker'].includes(role)) {
    return h.response({ message: 'Invalid role' }).code(400);
  }

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', user_id)
    .select()
    .single();

  if (error) {
    return h.response({ message: `Error managing access: ${error.message}` }).code(500);
  }
  if (!data) {
    return h.response({ message: 'User not found' }).code(404);
  }

  return h.response(data);
};

module.exports = {
  crudUser,
  manageAcademic,
  manageFinance,
  exportData,
  manageAccess
};