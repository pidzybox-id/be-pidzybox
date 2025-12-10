export const resetDatabase = async () => {
  try {
    await db.query(`
      DROP TABLE IF EXISTS photos CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS templates CASCADE;
    `);

    console.log("Tables dropped. Recreating...");
    
    await createPhotosTables();
    await createOrdersTable();
    await createTemplatesTable();

    console.log("All tables recreated successfully");
  } catch (err) {
    console.error("Error resetting DB:", err);
  }
};

resetDatabase();