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
const stickerData = [
  {
    name: "Purple 1",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/1.png"
  },
  {
    name: "Yellow 1",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/2.png"
  },
  {
    name: "Purple 2",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/3.png"
  },
  {
    name: "Yellow 2",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/4.png"
  },
  {
    name: "Purple 3",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/5.png"
  },
  {
    name: "Yellow 3",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/6.png"
  },
  {
    name: "Blue 1",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/7.png"
  },
  {
    name: "Purple 4",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/8.png"
  },
  {
    name: "Purple 5",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/9.png"
  },
  {
    name: "Yellow 4",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/10.png"
  },
  {
    name: "Purple 6",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/11.png"
  },
  {
    name: "Yellow 5",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/12.png"
  },
  {
    name: "Purple 7",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/13.png"
  },
  {
    name: "Purple 8",
    sticker_url : "https://pidzybox.b-cdn.net/Sticker/14.png"
  },
];

const seedSticker = async () => {
  try {
    console.log("Memulai proses seeding...");

    // 3. Loop data dan masukkan ke database
    for (const sticker of stickerData) {
      const query = `
        INSERT INTO stickers (sticker_url, name)
        VALUES ($1, $2)
      `;

      const values = [sticker.sticker_url, sticker.name];

      await db.query(query, values);
    }

    console.log(`Berhasil memasukkan ${stickerData.length} data sticker!`);
  } catch (err) {
    console.error("Gagal melakukan seeding:", err);
  } finally {
    db.end();
  }
};

// Jalankan Script
seedSticker();