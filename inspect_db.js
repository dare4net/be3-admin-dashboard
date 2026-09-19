const { Client } = require('pg');
// require('dotenv').config(); // Dotenv might not be in the frontend workspace

const config = {
    host: 'localhost',
    port: 5432,
    database: 'saas_ecommerce',
    user: 'postgres',
    password: '343434',
};

async function inspectSchema() {
    const client = new Client(config);

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'products'
            ORDER BY ordinal_position;
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

inspectSchema();
