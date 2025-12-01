import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Konfigurasi Database
export const db = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Data Dummy yang sudah disesuaikan
// Saya memetakan template_type secara manual berdasarkan asumsi umum
const templatesData = [
  { type: "1x3", photos: 3, url: "/images/frame-1-a.png" }, // 6 Photos Grid
  { type: "1x4", photos: 4, url: "/images/frame-2-a.png" }, // 4 Photos Vertical
  { type: "1x3", photos: 3, url: "/images/frame-1-b.png" }, // 2 Photos Strip
  { type: "1x3", photos: 3, url: "/images/frame-1-a.png" }, // 6 Photos Grid (tapi count 3?)
  { type: "1x4", photos: 4, url: "/images/frame-2-a.png" }, // 4 Photos Vertical (count 8)
  { type: "1x3", photos: 3, url: "/images/frame-1-b.png" },
  { type: "1x3", photos: 3, url: "/images/frame-1-a.png" },
  { type: "1x3", photos: 3, url: "/images/frame-1-b.png" },
  { type: "1x4", photos: 4, url: "/images/frame-2-a.png" },
  { type: "1x4", photos: 4, url: "/images/frame-2-a.png" },
  { type: "1x3", photos: 3, url: "/images/frame-1-b.png" },
  { type: "1x3", photos: 3, url: "/images/frame-1-a.png" },
];

const seedTemplates = async () => {
  try {
    // 1. Reset Tabel (Opsional: Aktifkan jika ingin menghapus data lama dan membuat ulang struktur)
    // await db.query("DROP TABLE IF EXISTS templates");

    // 2. Pastikan Tabel Ada dengan Struktur Terbaru
    await db.query(`
        CREATE TABLE IF NOT EXISTS templates (
            id SERIAL PRIMARY KEY,
            template_type TEXT,
            template_photos INTEGER,
            template_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Memulai proses seeding...");

    // 3. Loop data dan masukkan ke database
    for (const template of templatesData) {
      const query = `
        INSERT INTO templates (template_type, template_photos, template_url)
        VALUES ($1, $2, $3)
      `;
      
      const values = [template.type, template.photos, template.url];
      
      await db.query(query, values);
    }

    console.log(`Berhasil memasukkan ${templatesData.length} data template!`);

  } catch (err) {
    console.error("Gagal melakukan seeding:", err);
  } finally {
    db.end();
  }
};

// Jalankan Script
seedTemplates();