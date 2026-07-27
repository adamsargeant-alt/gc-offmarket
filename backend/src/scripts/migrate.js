const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function migrate() {
  const schemaPath = path.join(__dirname, '../../../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  try {
    await db.query(sql);
    console.log('✅ Database migration complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
