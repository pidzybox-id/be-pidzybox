import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

export const db = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

const createPhotosTables = async () => {
  const createPhotosTableQuery = `
    CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        link_photo TEXT,
        position INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `
    await db.query(createPhotosTableQuery);
    ;
};

const createOrdersTable = async () => {
  const createOrdersTableQuery = `
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        template_id TEXT,
        email TEXT,
        payment_status boolean DEFAULT FALSE,
        print_status boolean DEFAULT FALSE,
        send_email_status boolean DEFAULT FALSE,
        final_photo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  await db.query(createOrdersTableQuery)
  ;}

const createTemplatesTable = async () => {
  const createTemplatesTableQuery = `
    CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name TEXT,
        template_theme TEXT, 
        template_photos INTEGER, 
        guide_template_url TEXT,
        template_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
  await db.query(createTemplatesTableQuery);
}
const createStickerTable = async () => {
  const createTemplatesTableQuery = `
    CREATE TABLE IF NOT EXISTS stickers (
        id SERIAL PRIMARY KEY,
        name TEXT, 
        sticker_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
  await db.query(createTemplatesTableQuery);
}

// const initDB = async () => {
//   try {
//     await createPhotosTables();
//     await createOrdersTable();
//     await createTemplatesTable();
//     await createStickerTable();
//     console.log("All tables created successfully");
//   } catch (err) {
//     console.error("Error creating tables:", err);
//   } finally {
//     db.end();
//   }
// };

// initDB();

// export const resetDatabase = async () => {
//   try {
//     await db.query(`
//       DROP TABLE IF EXISTS photos CASCADE;
//       DROP TABLE IF EXISTS orders CASCADE;
//       DROP TABLE IF EXISTS templates CASCADE;
//     `);

//     console.log("Tables dropped. Recreating...");
    
//     await createPhotosTables();
//     await createOrdersTable();
//     await createTemplatesTable();

//     console.log("All tables recreated successfully");
//   } catch (err) {
//     console.error("Error resetting DB:", err);
//   }
// };

// resetDatabase();