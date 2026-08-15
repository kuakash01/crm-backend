import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { authenticateUser } from "../middleware/auth.middleware";

let io: Server;

export const initializeSocket = (
  httpServer: HttpServer
) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader =
        socket.handshake.headers.cookie;

      const token =
        getAccessTokenFromCookie(cookieHeader);

      if (!token) {
        return next(
          new Error("Unauthorized")
        );
      }

      const user =
        await authenticateUser(token);

      socket.data.user = user;

      next();
    } catch (error) {
      next(
        new Error("Invalid authentication")
      );
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log(
      `User ${user.id} connected: ${socket.id}`
    );

    socket.join(`user:${user.id}`);

    console.log(
      `User ${user.id} joined room user:${user.id}`
    );

    socket.on("disconnect", () => {
      console.log(
        `User ${user.id} disconnected`
      );
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized"
    );
  }

  return io;
};


const getAccessTokenFromCookie = (
  cookieHeader?: string
) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim());

  const accessTokenCookie = cookies.find(
    (cookie) =>
      cookie.startsWith("accessToken=")
  );

  if (!accessTokenCookie) {
    return null;
  }

  return decodeURIComponent(
    accessTokenCookie.substring(
      "accessToken=".length
    )
  );
};