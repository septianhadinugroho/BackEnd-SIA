const bcrypt = require('bcrypt');
const { response } = require('../utils/response');
const { exportToExcel } = require('../utils/export');

module.exports = {
  createUser: async (request, h) => {
    const { supabase } = request.server;
    const { identifier, email, password, role } = request.payload;

    // Validasi identifier unik
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('identifier', identifier)
      .single();

    if (existingUser) {
      return response.error(h, 'Identifier sudah digunakan', 400);
    }

    if (checkError && checkError.code !== 'PGRST116') {
      return response.error(h, 'Gagal memeriksa identifier', 500);
    }

    // Hash kata sandi
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan pengguna baru
    const { data, error } = await supabase
      .from('users')
      .insert({
        identifier,
        email,
        password: hashedPassword,
        role,
      })
      .select('id, identifier, email, role')
      .single();

    if (error) {
      return response.error(h, 'Gagal membuat pengguna', 400);
    }

    return response.success(h, data, 'Pengguna berhasil dibuat', 201);
  },

  updateUser: async (request, h) => {
    const { supabase } = request.server;
    const { userId } = request.params;
    const { email, role, password } = request.payload;

    const updateData = { email, role, updated_at: new Date() };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, identifier, email, role')
      .single();

    if (error || !data) {
      return response.error(h, 'Pengguna tidak ditemukan', 404);
    }

    return response.success(h, data, 'Pengguna berhasil diperbarui');
  },

  deleteUser: async (request, h) => {
    const { supabase } = request.server;
    const { userId } = request.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return response.error(h, 'Gagal menghapus pengguna', 500);
    }

    return response.success(h, null, 'Pengguna berhasil dihapus');
  },

  getUsers: async (request, h) => {
    const { supabase } = request.server;
    const { role, keyword } = request.query;

    let query = supabase
      .from('users')
      .select('id, identifier, email, role')
      .neq('id', request.auth.credentials.id); // Jangan tampilkan admin sendiri

    if (role) query = query.eq('role', role);
    if (keyword) query = query.or(`identifier.ilike.%${keyword}%,email.ilike.%${keyword}%`);

    const { data, error } = await query;

    if (error) {
      return response.error(h, 'Gagal mengambil data pengguna', 500);
    }

    return response.success(h, data);
  },

  manageKeuangan: async (request, h) => {
    const { supabase } = request.server;
    const { user_id, jenis, jumlah, tanggal_jatuh_tempo, status } = request.payload;

    const { data, error } = await supabase
      .from('keuangan')
      .insert({
        user_id,
        jenis,
        jumlah,
        status: status || 'belum_bayar',
        tanggal_jatuh_tempo: tanggal_jatuh_tempo ? new Date(tanggal_jatuh_tempo) : null,
        created_at: new Date(),
      })
      .select('*')
      .single();

    if (error) {
      return response.error(h, 'Gagal mengelola keuangan', 500);
    }

    // Kirim notifikasi ke mahasiswa
    await supabase
      .from('notifikasi')
      .insert({
        user_id,
        judul: `Tagihan ${jenis} Baru`,
        pesan: `Tagihan ${jenis} sebesar Rp${jumlah} telah ditambahkan. Jatuh tempo: ${tanggal_jatuh_tempo || '-'}.`,
        created_at: new Date(),
      });

    return response.success(h, data, 'Data keuangan berhasil ditambahkan', 201);
  },

  updateKeuangan: async (request, h) => {
    const { supabase } = request.server;
    const { keuanganId } = request.params;
    const { status, tanggal_bayar } = request.payload;

    const updateData = { status, updated_at: new Date() };
    if (tanggal_bayar) updateData.tanggal_bayar = new Date(tanggal_bayar);

    const { data, error } = await supabase
      .from('keuangan')
      .update(updateData)
      .eq('id', keuanganId)
      .select('*')
      .single();

    if (error || !data) {
      return response.error(h, 'Data keuangan tidak ditemukan', 404);
    }

    // Kirim notifikasi ke mahasiswa
    await supabase
      .from('notifikasi')
      .insert({
        user_id: data.user_id,
        judul: `Perubahan Status Tagihan ${data.jenis}`,
        pesan: `Status tagihan ${data.jenis} telah diperbarui menjadi ${status}.`,
        created_at: new Date(),
      });

    return response.success(h, data, 'Data keuangan berhasil diperbarui');
  },

  manageHakAkses: async (request, h) => {
    const { supabase } = request.server;
    const { user_id, modul, izin } = request.payload;

    const { data, error } = await supabase
      .from('hak_akses')
      .upsert({
        user_id,
        modul,
        izin,
        updated_at: new Date(),
      })
      .select('*')
      .single();

    if (error) {
      return response.error(h, 'Gagal mengelola hak akses', 500);
    }

    return response.success(h, data, 'Hak akses berhasil diperbarui', 201);
  },

  manageAkademik: async (request, h) => {
    const { supabase } = request.server;
    const { user_id, semester, tahun_akademik, mata_kuliah, total_sks, ip_semester, type } = request.payload;

    let table = type === 'krs' ? 'krs' : 'khs';
    let dataPayload = {
      user_id,
      semester,
      tahun_akademik,
      mata_kuliah,
      updated_at: new Date(),
    };

    if (type === 'krs') dataPayload.total_sks = total_sks;
    if (type === 'khs') dataPayload.ip_semester = ip_semester;

    const { data, error } = await supabase
      .from(table)
      .insert(dataPayload)
      .select('*')
      .single();

    if (error) {
      return response.error(h, `Gagal mengelola data ${type.toUpperCase()}`, 500);
    }

    // Kirim notifikasi ke mahasiswa
    await supabase
      .from('notifikasi')
      .insert({
        user_id,
        judul: `Data ${type.toUpperCase()} Baru`,
        pesan: `Data ${type.toUpperCase()} untuk semester ${semester} ${tahun_akademik} telah ditambahkan.`,
        created_at: new Date(),
      });

    return response.success(h, data, `Data ${type.toUpperCase()} berhasil ditambahkan`, 201);
  },

  exportData: async (request, h) => {
    const { supabase } = request.server;
    const { modul } = request.query;

    let data, headers;
    if (modul === 'mahasiswa') {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('users(identifier, email, role), nama_lengkap, fakultas, jurusan, angkatan')
        .eq('users.role', 'mahasiswa');

      if (error) {
        return response.error(h, 'Gagal mengekspor data', 500);
      }

      data = usersData;
      headers = [
        { header: 'NIM', key: 'identifier', width: 20 },
        { header: 'Nama Lengkap', key: 'nama_lengkap', width: 30 },
        { header: 'Fakultas', key: 'fakultas', width: 20 },
        { header: 'Jurusan', key: 'jurusan', width: 20 },
        { header: 'Angkatan', key: 'angkatan', width: 10 },
        { header: 'Email', key: 'email', width: 30 },
      ];
    } else if (modul === 'keuangan') {
      const { data: keuanganData, error } = await supabase
        .from('keuangan')
        .select('users(identifier), jenis, jumlah, status, tanggal_jatuh_tempo, tanggal_bayar');

      if (error) {
        return response.error(h, 'Gagal mengekspor data', 500);
      }

      data = keuanganData;
      headers = [
        { header: 'NIM', key: 'identifier', width: 20 },
        { header: 'Jenis Tagihan', key: 'jenis', width: 20 },
        { header: 'Jumlah', key: 'jumlah', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Jatuh Tempo', key: 'tanggal_jatuh_tempo', width: 20 },
        { header: 'Tanggal Bayar', key: 'tanggal_bayar', width: 20 },
      ];
    } else {
      return response.error(h, 'Modul tidak valid', 400);
    }

    const buffer = await exportToExcel(data, headers, `export_${modul}`);
    return h.response(buffer)
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename=${modul}_${Date.now()}.xlsx`);
  },
};