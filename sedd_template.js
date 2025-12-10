import pkg from "pg";
const { Pool } = pkg;
import "dotenv/config";

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
  {
    type: "2x1",
    photos: 2,
    guide_template_url: "/images/templates-photo/guideline/templateguideline1.png",
    url_template: "/images/templates-photo/templates/Template1.png",
  },
  {
    type: "2x1",
    photos: 1,
    guide_template_url: "/images/templates-photo/guideline/templateguideline2.png",
    url_template: "/images/templates-photo/templates/Template1.png",
  },
  {
    type: "2x1",
    photos: 2,
    guide_template_url: "/images/templates-photo/guideline/templateguideline3.png",
    url_template: "/images/templates-photo/templates/Template3.png",
  },
  {
    type: "2x1",
    photos: 1,
    guide_template_url: "/images/templates-photo/guideline/templateguideline4.png",
    url_template: "/images/templates-photo/templates/Template3.png",
  },
  {
    type: "2x2",
    photos: 2,
    guide_template_url: "/images/templates-photo/guideline/templateguideline5.png",
    url_template: "/images/templates-photo/templates/Template2.png",
  },
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
            guide_template_url TEXT,
            template_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Memulai proses seeding...");

    // 3. Loop data dan masukkan ke database
    for (const template of templatesData) {
      const query = `
        INSERT INTO templates (template_type, template_photos, guide_template_url, template_url)
        VALUES ($1, $2, $3, $4)
      `;

      const values = [template.type, template.photos, template.guide_template_url, template.url_template];

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