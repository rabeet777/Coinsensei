require('dotenv').config({ path: '.env.local' });
const PgBoss = require('pg-boss');

const boss = new PgBoss({
  connectionString: process.env.SUPABASE_DB_URL
});

boss.start()
  .then(() => {
    console.log('pg-boss started and tables should be created.');
    return boss.stop();
  })
  .catch(err => {
    console.error('Error starting pg-boss:', err);
  }); 