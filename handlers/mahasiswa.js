const { response } = require('../utils/response');

module.exports = {
  getDashboard: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;

    // Ambil data untuk dashboard mahasiswa
    const [profileData, krsData, khsData, keuanganData, notifikasiData] = await Promise.all([
      supabase.from('profiles').select('nama_lengkap, fakultas, jurusan, angkatan').eq('user_id', userId).single(),
      supabase.from('krs').select('semester, total_sks, status, tahun_akademik').eq('user_id', userId).order('semester', { ascending: false }).limit(1),
      supabase.from('khs').select('semester, ip_semester, tahun_akademik').eq('user_id', userId).order('semester', { ascending: false }).limit(1),
      supabase.from('keuangan').select('jenis, jumlah, status, tanggal_jatuh_tempo').eq('user_id', userId).eq('status', 'belum_bayar').limit(5),
      supabase.from('notifikasi').select('judul, is_read').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    ]);

    if (profileData.error || krsData.error || khsData.error || keuanganData.error || notifikasiData.error) {
      return response.error(h, 'Gagal mengambil data dashboard', 500);
    }

    // Format data untuk grafik dashboard
    const dashboardData = {
      profile: profileData.data,
      krs: krsData.data[0] || null,
      khs: khsData.data[0] || null,
      keuangan: keuanganData.data,
      notifikasi: notifikasiData.data,
      grafik: {
        ipk: khsData.data[0]?.ip_semester || 0,
        total_sks: krsData.data[0]?.total_sks || 0,
        tagihan_belum_bayar: keuanganData.data.length,
        notifikasi_belum_dibaca: notifikasiData.data.filter(n => !n.is_read).length,
      },
    };

    return response.success(h, dashboardData);
  },

  getProfile: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;

    const { data, error } = await supabase
      .from('profiles')
      .select('nama_lengkap, fakultas, jurusan, angkatan, telepon, alamat')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return response.error(h, 'Profil tidak ditemukan', 404);
    }

    return response.success(h, data);
  },

  updateProfile: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;
    const { nama_lengkap, fakultas, jurusan, angkatan, telepon, alamat } = request.payload;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        nama_lengkap,
        fakultas,
        jurusan,
        angkatan,
        telepon,
        alamat,
        updated_at: new Date(),
      })
      .select('*')
      .single();

    if (error) {
      return response.error(h, 'Gagal memperbarui profil', 500);
    }

    return response.success(h, data, 'Profil berhasil diperbarui');
  },

  getKrs: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;
    const { semester, tahun_akademik } = request.query;

    let query = supabase
      .from('krs')
      .select('id, semester, tahun_akademik, mata_kuliah, total_sks, status')
      .eq('user_id', userId)
      .order('semester', { ascending: false });

    if (semester) query = query.eq('semester', semester);
    if (tahun_akademik) query = query.eq('tahun_akademik', tahun_akademik);

    const { data, error } = await query;

    if (error) {
      return response.error(h, 'Gagal mengambil data KRS', 500);
    }

    return response.success(h, data);
  },

  getKhs: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;
    const { semester, tahun_akademik } = request.query;

    let query = supabase
      .from('khs')
      .select('id, semester, tahun_akademik, mata_kuliah, ip_semester')
      .eq('user_id', userId)
      .order('semester', { ascending: false });

    if (semester) query = query.eq('semester', semester);
    if (tahun_akademik) query = query.eq('tahun_akademik', tahun_akademik);

    const { data, error } = await query;

    if (error) {
      return response.error(h, 'Gagal mengambil data KHS', 500);
    }

    return response.success(h, data);
  },

  getKeuangan: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;
    const { status } = request.query;

    let query = supabase
      .from('keuangan')
      .select('id, jenis, jumlah, status, tanggal_jatuh_tempo, tanggal_bayar')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      return response.error(h, 'Gagal mengambil data keuangan', 500);
    }

    return response.success(h, data);
  },

  submitPermohonan: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;
    const { jenis, keterangan } = request.payload;

    const { data, error } = await supabase
      .from('permohonan')
      .insert({
        user_id: userId,
        jenis_permohonan: jenis,
        keterangan,
        status: 'diajukan',
        created_at: new Date(),
      })
      .select('*')
      .single();

    if (error) {
      return response.error(h, 'Gagal mengajukan permohonan', 500);
    }

    // Kirim notifikasi
    await supabase
      .from('notifikasi')
      .insert({
        user_id: userId,
        judul: `Permohonan ${jenis} Diajukan`,
        pesan: `Permohonan ${jenis} telah berhasil diajukan.`,
        created_at: new Date(),
      });

    return response.success(h, data, 'Permohonan berhasil diajukan', 201);
  },

  getNotifikasi: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;
    const { is_read } = request.query;

    let query = supabase
      .from('notifikasi')
      .select('id, judul, pesan, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (is_read !== undefined) query = query.eq('is_read', is_read);

    const { data, error } = await query;

    if (error) {
      return response.error(h, 'Gagal mengambil notifikasi', 500);
    }

    return response.success(h, data);
  },

  markNotifikasiRead: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;
    const { notifikasiId } = request.params;

    const { data, error } = await supabase
      .from('notifikasi')
      .update({ is_read: true, updated_at: new Date() })
      .eq('id', notifikasiId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      return response.error(h, 'Notifikasi tidak ditemukan', 404);
    }

    return response.success(h, data, 'Notifikasi ditandai sebagai dibaca');
  },

  verifyToken: async (request, h) => {
    const { supabase } = request.server;
    const { credentials } = request.auth;

    if (!credentials) {
      return response.error(h, 'Token tidak valid atau tidak ditemukan', 401);
    }

    const { id: userId, role } = credentials; // userId and role are already available from JWT

    // Optionally fetch nama_lengkap from profiles if required for this endpoint's response
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nama_lengkap') // Only select nama_lengkap, as 'role' is in the 'users' table
      .eq('user_id', userId)
      .single();

    // Handle potential error from fetching profile, specifically ignoring 'no rows found' (PGRST116)
    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Supabase Profile Fetch Error (verifyToken):', profileError);
        return response.error(h, 'Gagal mengambil data profil', 500);
    }

    return response.success(h, {
      user_id: userId,
      role: role, // Use the role from the already validated credentials
      nama_lengkap: profile ? profile.nama_lengkap : null, // Include nama_lengkap if a profile was found
    });
  },
};