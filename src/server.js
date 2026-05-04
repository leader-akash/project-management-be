const http = require("http");
const app = require("./app");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const env = require("./config/env");
const { closeRedisClients, createRedisClients } = require("./config/redis");
const initSockets = require("./sockets");

let server;
let redisClients;

async function start() {
  await connectDatabase();
  redisClients = await createRedisClients();

  server = http.createServer(app);
  initSockets(server, redisClients);

  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await closeRedisClients(redisClients);
  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

