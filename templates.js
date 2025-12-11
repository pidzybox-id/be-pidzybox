import { db } from './db.js';


export const getAllTemplates = async () => {
  const res = await db.query('SELECT * FROM templates ORDER BY created_at DESC');
  return res.rows;
}

export const getTemplateById = async (id) => {
  const res = await db.query('SELECT * FROM templates WHERE id = $1', [id]);
  return res.rows[0];
}

export const createTemplate = async (template_theme, template_photos, guide_template_url, template_url, name) => {
  const res = await db.query(
    `INSERT INTO templates (template_theme, template_photos, guide_template_url, template_url, name)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [template_theme, template_photos, guide_template_url, template_url, name]
  );
  if (!res.rows[0]) {
    throw new Error('Failed to create template');
  }
  return res.rows[0];
}

export const deleteTemplate = async (id) => {
  const res = await db.query('DELETE FROM templates WHERE id = $1 RETURNING *', [id]);
  if (!res.rows[0]) {
    throw new Error('Template not found or failed to delete');
  }
  return res.rows[0];
}