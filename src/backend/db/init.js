import postgres from 'postgres'
import { createClient } from 'redis';

// Postgresql

const sql = await postgres({
    host: "localhost",
    port: 5432,
    database: "postgres",
    username: "postgres",
    password: "123123"
})

// REDIS

const redis = createClient();
redis.on('error', err => console.log('Redis Client Error', err));
await redis.connect();

export {redis, sql}