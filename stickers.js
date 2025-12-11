import { db } from './db.js';


export const getAllStickers = async () => {
  const res = await db.query('SELECT * FROM stickers ORDER BY created_at DESC');
  return res.rows;
}

export const getStickerById = async (id) => {
  const res = await db.query('SELECT * FROM stickers WHERE id = $1', [id]);
  return res.rows[0];
}

export const createSticker = async (name, sticker_url) => {
  const res = await db.query(
    `INSERT INTO stickers (name, sticker_url)
        VALUES ($1, $2) RETURNING *`,
    [name, sticker_url]
  );
    if (!res.rows[0]) {
    throw new Error('Failed to create sticker');
  }
    return res.rows[0];
}

export const deleteSticker = async (id) => {
  const res = await db.query('DELETE FROM stickers WHERE id = $1 RETURNING *', [id]);
    if (!res.rows[0]) {
    throw new Error('Sticker not found or failed to delete');
  }
    return res.rows[0];
}
