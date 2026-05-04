const { createClient } = require("redis");
const env = require("./env");

async function createRedisClients() {
  if (!env.REDIS_URL) {
    console.warn("REDIS_URL is not set. Socket.IO will run without the Redis adapter.");
    return null;
  }

  const pubClient = createClient({ url: env.REDIS_URL });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => console.error("Redis pub client error:", error.message));
  subClient.on("error", (error) => console.error("Redis sub client error:", error.message));

  try {
    await pubClient.connect();
    await subClient.connect();
  } catch (error) {
    await Promise.allSettled([pubClient.quit(), subClient.quit()]);
    if (env.NODE_ENV === "production") {
      throw error;
    }
    console.warn(`Redis unavailable. Continuing without Socket.IO Redis adapter: ${error.message}`);
    return null;
  }

  console.log("Redis connected for Socket.IO adapter.");
  return { pubClient, subClient };
}

async function closeRedisClients(clients) {
  if (!clients) return;
  await Promise.allSettled([clients.pubClient.quit(), clients.subClient.quit()]);
}

module.exports = {
  createRedisClients,
  closeRedisClients
};
