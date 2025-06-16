# Satu Data Mahasiswa Backend

Backend untuk sistem **Satu Data Mahasiswa**, sebuah aplikasi manajemen data mahasiswa yang terintegrasi untuk mendukung autentikasi, manajemen akademik, keuangan, permohonan, dan laporan. Dibangun menggunakan **Hapi.js**, **Supabase**, dan **PostgreSQL**.

## Fitur
- **Autentikasi**: Login dan registrasi untuk tiga peran pengguna (Mahasiswa, Admin, Pemangku Kebijakan).
- **Dashboard Mahasiswa**: Menampilkan profil, KRS, KHS, status keuangan, dan notifikasi dengan visualisasi grafik.
- **Manajemen Admin**: CRUD pengguna, pengelolaan keuangan, akademik, hak akses, dan ekspor data ke Excel.
- **Dashboard Pemangku Kebijakan**: Pencarian data mahasiswa, pembuatan laporan akademik, dan ekspor laporan.
- **Notifikasi**: Pemberitahuan otomatis untuk mahasiswa terkait keuangan, permohonan, dan lainnya.
- **Keamanan**: Autentikasi JWT dengan validasi role-based menggunakan Supabase.

## Persyaratan
- **Node.js**: Versi 18.x atau lebih baru.
- **Supabase**: Akun Supabase dengan proyek aktif.
- **PostgreSQL**: Database Supabase dengan skema yang diberikan.
- **Dependensi**:
  ```json
  {
    "@hapi/hapi": "^21.3.2",
    "@hapi/jwt": "^3.2.0",
    "@supabase/supabase-js": "^2.45.4",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "exceljs": "^4.4.0",
    "joi": "^17.13.3",
    "jsonwebtoken": "^9.0.2",
    "nodemon": "^3.1.4" (dev)
  }
  ```

## Instalasi
1. **Kloning Repositori**:
   ```bash
   git clone <repository_url>
   cd satu-data-mahasiswa-backend
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   - Buat file `.env` di root proyek:
     ```plaintext
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     JWT_SECRET=your_strong_jwt_secret_here_32_chars_or_more
     PORT=3000
     ```
   - Ganti nilai dengan kredensial Supabase dan secret JWT Anda.

4. **Setup Database**:
   - Jalankan skema database di Supabase SQL Editor (lihat `schema.sql`).
   - Pastikan tabel `users`, `profiles`, `krs`, `khs`, `keuangan`, `permohonan`, `notifikasi`, `laporan`, dan `hak_akses` telah dibuat.

5. **Jalankan Server**:
   - Produksi:
     ```bash
     npm start
     ```
   - Development (dengan auto-reload):
     ```bash
     npm run dev
     ```
   - Server akan berjalan di `http://localhost:3000`.

## Struktur Endpoint
Base URL: `http://localhost:3000`

### Autentikasi
| Method | Endpoint            | Deskripsi                     | Auth Required | Payload/Response Example |
|--------|---------------------|-------------------------------|---------------|--------------------------|
| POST   | `/auth/login`       | Login pengguna                | No            | **Payload**: `{ "identifier": "1234567890", "password": "test_password" }`<br>**Response**: `{ "status": "success", "data": { "token": "<jwt_token>" } }` |
| POST   | `/auth/register`    | Registrasi pengguna baru      | No            | **Payload**: `{ "identifier": "1234567890", "email": "test@example.com", "password": "test_password", "role": "mahasiswa" }`<br>**Response**: `{ "status": "success", "data": { "user_id": "<uuid>" } }` |

### Mahasiswa
| Method | Endpoint                       | Deskripsi                     | Auth Required | Scope        | Query/Payload Example |
|--------|--------------------------------|-------------------------------|---------------|--------------|-----------------------|
| GET    | `/mahasiswa/dashboard`         | Ambil data dashboard          | Yes           | mahasiswa    | **Response**: `{ "status": "success", "data": { "profil": {}, "krs": [], "khs": [], "keuangan": [], "notifikasi": [] } }` |
| GET    | `/mahasiswa/profile`           | Ambil profil mahasiswa        | Yes           | mahasiswa    | **Response**: `{ "status": "success", "data": { "nama_lengkap": "John Doe", "fakultas": "Teknik" } }` |
| PUT    | `/mahasiswa/profile`           | Perbarui profil               | Yes           | mahasiswa    | **Payload**: `{ "nama_lengkap": "John Doe", "telepon": "081234567890" }` |
| GET    | `/mahasiswa/krs`               | Ambil KRS                     | Yes           | mahasiswa    | **Query**: `?semester=1&tahun_akademik=2023/2024` |
| GET    | `/mahasiswa/khs`               | Ambil KHS                     | Yes           | mahasiswa    | **Query**: `?semester=1&tahun_akademik=2023/2024` |
| GET    | `/mahasiswa/keuangan`          | Ambil status keuangan         | Yes           | mahasiswa    | **Query**: `?status=belum_bayar` |
| POST   | `/mahasiswa/permohonan`        | Ajukan permohonan             | Yes           | mahasiswa    | **Payload**: `{ "jenis_permohonan": "cuti", "keterangan": "Cuti semester" }` |
| GET    | `/mahasiswa/notifikasi`        | Ambil notifikasi              | Yes           | mahasiswa    | **Query**: `?is_read=false` |
| PATCH  | `/mahasiswa/notifikasi/{id}`   | Tandai notifikasi dibaca      | Yes           | mahasiswa    | **Params**: `id=<uuid>` |

### Admin
| Method | Endpoint                   | Deskripsi                     | Auth Required | Scope | Payload/Query Example |
|--------|----------------------------|-------------------------------|---------------|-------|-----------------------|
| POST   | `/admin/user`              | Buat pengguna baru            | Yes           | admin | **Payload**: `{ "identifier": "admin123", "email": "admin@example.com", "password": "admin_pass", "role": "admin" }` |
| PUT    | `/admin/user/{userId}`     | Perbarui pengguna             | Yes           | admin | **Params**: `userId=<uuid>`<br>**Payload**: `{ "email": "new@example.com" }` |
| DELETE | `/admin/user/{userId}`     | Hapus pengguna                | Yes           | admin | **Params**: `userId=<uuid>` |
| GET    | `/admin/users`             | Ambil daftar pengguna         | Yes           | admin | **Query**: `?role=mahasiswa&keyword=John` |
| POST   | `/admin/keuangan`          | Tambah tagihan keuangan       | Yes           | admin | **Payload**: `{ "user_id": "<uuid>", "jenis_tagihan": "UKT", "jumlah": 5000000 }` |
| PUT    | `/admin/keuangan/{id}`     | Perbarui status keuangan      | Yes           | admin | **Params**: `id=<uuid>`<br>**Payload**: `{ "status": "lunas", "tanggal_bayar": "2025-06-17" }` |
| POST   | `/admin/hak-akses`         | Kelola hak akses              | Yes           | admin | **Payload**: `{ "user_id": "<uuid>", "modul": "akademik", "izin": { "read": true, "write": true } }` |
| POST   | `/admin/akademik`          | Kelola data akademik (KRS/KHS)| Yes           | admin | **Payload**: `{ "user_id": "<uuid>", "semester": 1, "tahun_akademik": "2023/2024", "mata_kuliah": [{ "kode": "TI101", "nama": "Pemrograman", "sks": 3 }], "type": "krs" }` |
| GET    | `/admin/export`            | Ekspor data ke Excel          | Yes           | admin | **Query**: `?modul=mahasiswa` |

### Pemangku Kebijakan
| Method | Endpoint                            | Deskripsi                     | Auth Required | Scope               | Query/Payload Example |
|--------|-------------------------------------|-------------------------------|---------------|---------------------|-----------------------|
| GET    | `/pemangku_kebijakan/dashboard`     | Ambil dashboard eksklusif     | Yes           | pemangku_kebijakan | **Response**: `{ "status": "success", "data": { "statistik": {} } }` |
| GET    | `/pemangku_kebijakan/search`        | Cari dan filter data          | Yes           | pemangku_kebijakan | **Query**: `?keyword=John&fakultas=Teknik&tahun_akademik=2023/2024` |
| GET    | `/pemangku_kebijakan/laporan/{id}`  | Ambil detail laporan          | Yes           | pemangku_kebijakan | **Params**: `id=<uuid>` |
| POST   | `/pemangku_kebijakan/laporan`       | Buat laporan baru             | Yes           | pemangku_kebijakan | **Payload**: `{ "judul": "Laporan Akademik 2023", "data": [{}] }` |
| GET    | `/pemangku_kebijakan/laporan/{id}/export` | Ekspor laporan ke Excel | Yes           | pemangku_kebijakan | **Params**: `id=<uuid>` |

## Contoh Penggunaan
### Login
```bash
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{"identifier":"1234567890","password":"test_password"}'
```
**Response**:
```json
{
  "status": "success",
  "data": {
    "token": "<jwt_token>"
  }
}
```

### Ambil Dashboard Mahasiswa
```bash
curl -X GET http://localhost:3000/mahasiswa/dashboard \
-H "Authorization: Bearer <jwt_token>"
```
**Response**:
```json
{
  "status": "success",
  "data": {
    "profil": { "nama_lengkap": "John Doe", "fakultas": "Teknik" },
    "krs": [],
    "khs": [],
    "keuangan": [],
    "notifikasi": []
  }
}
```

## Struktur Proyek
```
satu-data-mahasiswa-backend/
├── config/
│   └── supabase.js
├── handlers/
│   ├── auth.js
│   ├── mahasiswa.js
│   ├── admin.js
│   └── pemangkuKebijakan.js
├── plugins/
│   ├── jwt.js
│   └── supabase.js
├── routes/
│   ├── auth.js
│   ├── mahasiswa.js
│   ├── admin.js
│   └── pemangkuKebijakan.js
├── schemas/
│   ├── auth.js
│   ├── mahasiswa.js
│   ├── admin.js
│   └── pemangkuKebijakan.js
├── utils/
│   ├── response.js
│   └── export.js
├── .env
├── package.json
├── server.js
└── README.md
```

## Pengujian
- Gunakan **Postman** atau **cURL** untuk menguji endpoint.
- Pastikan database Supabase memiliki data pengguna untuk login/registrasi.
- Tambahkan pengguna awal di tabel `users`:
  ```sql
  INSERT INTO users (identifier, email, password, role)
  VALUES ('1234567890', 'test@example.com', '$2b$10$<hashed_password>', 'mahasiswa');
  ```
- Hash password menggunakan bcrypt:
  ```javascript
  const bcrypt = require('bcrypt');
  bcrypt.hash('test_password', 10).then(console.log);
  ```

## Catatan
- **Keamanan**: Pastikan `JWT_SECRET` di `.env` adalah string yang kuat dan unik.
- **CORS**: API diatur untuk menerima permintaan dari `http://localhost:5173`. Sesuaikan di `server.js` jika frontend menggunakan origin lain.
- **Database**: Skema database di `schema.sql` harus dijalankan di Supabase sebelum menjalankan server.
- **Logging**: Server mencatat setiap permintaan di konsol untuk debugging.

## Kontribusi
1. Fork repositori ini.
2. Buat branch fitur (`git checkout -b fitur-baru`).
3. Commit perubahan (`git commit -m 'Menambahkan fitur X'`).
4. Push ke branch (`git push origin fitur-baru`).
5. Buat Pull Request.

## Lisensi
MIT License © 2025 Satu Data Mahasiswa Team