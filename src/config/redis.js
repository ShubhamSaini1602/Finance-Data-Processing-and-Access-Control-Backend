import redis from "redis";

const redisClient = redis.createClient({
    username: 'default',
    password: process.env.REDIS_KEY,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

// Redis Error Listener
redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
});

export default redisClient;
