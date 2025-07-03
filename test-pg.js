require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL
});

client.connect()
  .then(() => {
    console.log('Connected!');
    return client.end();
  })
  .catch(err => {
    console.error('Connection error:', err);
  }); 