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

// Data REAL
const templatesData = [
  {
    type: "1x2",
    theme: "Basic Blue",
    photos: 2,
    guide_template_url: "https://pidzybox.b-cdn.net/Guide/1.png",
    url_template: "https://pidzybox.b-cdn.net/Template/1.png",
    name: "Basic Blue 1",
  },
  {
    type: "2x2",
    theme: "Basic Blue",
    photos: 2,
    guide_template_url: "https://pidzybox.b-cdn.net/Guide/2.png",
    url_template: "https://pidzybox.b-cdn.net/Template/2.png",
    name: "Basic Blue 2",
  },
  {
    type: "1x1",
    theme: "Basic Blue",
    photos: 1,
    guide_template_url: "https://pidzybox.b-cdn.net/Guide/3.png",
    url_template: "https://pidzybox.b-cdn.net/Template/3.png",
    name: "Basic Blue 3",
  },
  {
    type: "1x1",
    theme: "Basic White",
    photos: 1,
    guide_template_url: "https://pidzybox.b-cdn.net/Guide/4.png",
    url_template: "https://pidzybox.b-cdn.net/Template/4.png",
    name: "Basic White 1",
  },
  {
    type: "1x2",
    theme: "Basic White",
    photos: 2,
    guide_template_url: "https://pidzybox.b-cdn.net/Guide/5.png",
    url_template: "https://pidzybox.b-cdn.net/Template/5.png",
    name: "Basic White 2",
  },
];

const seedTemplates = async () => {
  try {
    console.log("Memulai proses seeding...");

    // 3. Loop data dan masukkan ke database
    for (const template of templatesData) {
      const query = `
        INSERT INTO templates (template_type, template_theme, template_photos, guide_template_url, template_url, name)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const values = [template.type, template.theme, template.photos, template.guide_template_url, template.url_template, template.name];

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