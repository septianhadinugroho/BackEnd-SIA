const { response } = require('../utils/response');
const { exportToExcel } = require('../utils/export');

module.exports = {
  getDashboard: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;

    // Ambil data untuk dashboard eksklusif
    const [laporanData, statistikKhs, statistikKeuangan] = await Promise.all([
      supabase.from('laporan').select('id, judul, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('khs').select('ip_semester').rangeGt('ip_semester', 0),
      supabase.from('keuangan').select('status').eq('status', 'belum_bayar'),
    ]);

    if (laporanData.error || statistikKhs.error || statistikKeuangan.error) {
      return response.error(h, 'Gagal mengambil data dashboard', 500);
    }

    // Hitung statistik
    const rataRataIp = statistikKhs.data.reduce((sum, khs) => sum + khs.ip_semester, 0) / (statistikKhs.data.length || 1);
    const totalTagihanBelumBayar = statistikKeuangan.data.length;

    return response.success(h, {
      laporanTerbaru: laporanData.data,
      statistik: {
        rata_rata_ip: Number(rataRataIp.toFixed(2)),
        tagihan_belum_bayar: totalTagihanBelumBayar,
        total_mahasiswa: (await supabase.from('users').select('id').eq('role', 'mahasiswa')).data.length,
      },
    });
  },

  searchData: async (request, h) => {
    const { supabase } = request.server;
    const { keyword, fakultas, tahun_akademik, semester } = request.query;

    let query = supabase
      .from('profiles')
      .select('users(identifier, email, role), nama_lengkap, fakultas, jurusan, angkatan')
      .eq('users.role', 'mahasiswa');

    if (keyword) {
      query = query.or(`nama_lengkap.ilike.%${keyword}%,users.identifier.ilike.%${keyword}%`);
    }
    if (fakultas) {
      query = query.eq('fakultas', fakultas);
    }

    if (tahun_akademik || semester) {
      query = query
        .join('khs', 'profiles.user_id', 'khs.user_id');
      if (tahun_akademik) query = query.eq('khs.tahun_akademik', tahun_akademik);
      if (semester) query = query.eq('khs.semester', semester);
    }

    const { data, error } = await query;

    if (error) {
      return response.error(h, 'Gagal mencari data', 500);
    }

    return response.success(h, data);
  },

  getLaporan: async (request, h) => {
    const { supabase } = request.server;
    const { id: laporanId } = request.params;

    const { data, error } = await supabase
      .from('laporan')
      .select('id, judul, data, created_at, created_by(identifier, email)')
      .eq('id', laporanId)
      .single();

    if (error || !data) {
      return response.error(h, 'Laporan tidak ditemukan', 404);
    }

    return response.success(h, data);
  },

  createLaporan: async (request, h) => {
    const { supabase } = request.server;
    const { id: userId } = request.auth.credentials;
    const { judul, data } = request.payload;

    const { data: laporan, error } = await supabase
      .from('laporan')
      .insert({
        judul,
        data,
        created_by: userId,
        created_at: new Date(),
      })
      .select('*')
      .single();

    if (error) {
      return response.error(h, 'Gagal membuat laporan', 500);
    }

    return response.success(h, laporan, 'Laporan berhasil dibuat', 201);
  },

  exportLaporan: async (request, h) => {
    const { supabase } = request.server;
    const { id: laporanId } = request.params;

    const { data: laporan, error } = await supabase
      .from('laporan')
      .select('judul, data')
      .eq('id', laporanId)
      .single();

    if (error || !laporan) {
      return response.error(h, 'Laporan tidak ditemukan', 404);
    }

    const headers = Object.keys(laporan.data[0]).map((key) => ({
      header: key,
      key,
      width: 20,
    }));

    const buffer = await exportToExcel(laporan.data, headers, `laporan_${laporanId}`);
    return h.response(buffer)
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename=laporan_${laporan.judul}_${Date.now()}.xlsx`);
  },
};