const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const env = require("../config/env");
const User = require("../models/User");
const projectService = require("../services/project.service");
const socketService = require("../services/socket.service");
const { verifyToken } = require("../utils/jwt");

function extractToken(socket) {
  const authToken = socket.handshake.auth?.token;
  const queryToken = socket.handshake.query?.token;
  const header = socket.handshake.headers?.authorization || "";
  const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  return authToken || queryToken || bearerToken;
}

function initSockets(httpServer, redisClients) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  if (redisClients) {
    io.adapter(createAdapter(redisClients.pubClient, redisClients.subClient));
  }

  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error("Authentication token is required."));
      }

      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) {
        return next(new Error("Authenticated user was not found."));
      }

      socket.user = user;
      return next();
    } catch (_error) {
      return next(new Error("Authentication token is invalid or expired."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("project:join", async ({ projectId } = {}, ack) => {
      try {
        const project = await projectService.getProjectById(projectId, socket.user);
        const room = socketService.projectRoom(project._id.toString());

        socket.join(room);
        socket.to(room).emit("project:user-joined", {
          projectId: project._id,
          user: {
            _id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email
          }
        });

        if (typeof ack === "function") ack({ ok: true });
      } catch (error) {
        if (typeof ack === "function") ack({ ok: false, message: error.message });
      }
    });

    socket.on("project:leave", ({ projectId } = {}, ack) => {
      const room = socketService.projectRoom(projectId);
      socket.leave(room);
      socket.to(room).emit("project:user-left", {
        projectId,
        userId: socket.user._id
      });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("ping", (ack) => {
      if (typeof ack === "function") ack({ ok: true, serverTime: new Date().toISOString() });
    });
  });

  socketService.setIO(io);
  return io;
}

module.exports = initSockets;

