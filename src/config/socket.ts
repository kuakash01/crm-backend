import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { JWT_SECRET, CORS_ORIGIN } from "./env";
import { pool } from "./db";


let io: Server;

export const initializeSocket = (
  httpServer: HttpServer
) => {
  io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      // In production (Vercel + Render), the frontend fetches a token via
      // the Next.js proxy and passes it here as socket.auth.token to avoid
      // cross-domain HttpOnly cookie scoping issues.
      // In local dev, the cookie path is used as fallback.
      const authToken = socket.handshake.auth?.token as string | undefined;

      const cookieHeader = socket.handshake.headers.cookie;
      const cookieToken = getAccessTokenFromCookie(cookieHeader);

      const token = authToken || cookieToken;

      if (!token) {
        return next(
          new Error("Unauthorized")
        );
      }

      const user =
        await verifyTokenSocket(token);

      if (!user) {
        return next(
          new Error("Unauthorized")
        );
      }

      socket.data.user = user;

      next();
    } catch {
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

    if (user.organization_id) {
      socket.join(`org:${user.organization_id}`);
      console.log(
        `User ${user.id} joined room org:${user.organization_id}`
      );
    }

    socket.on("disconnect", () => {
      console.log(
        `User ${user.id} disconnected: ${socket.id}`
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

export const emitToOrganization = (
  organizationId: number,
  event: string,
  data: any
) => {
  try {
    if (!io || !organizationId) return;
    io.to(`org:${organizationId}`).emit(event, data);
  } catch (err) {
    console.error(`Failed to emit ${event} to org:${organizationId}:`, err);
  }
};

export interface DashboardUpdateEvent {
  entityType?: "LEAD" | "DEAL" | "CUSTOMER" | "TASK" | "ACTIVITY" | string | null;
  entityId?: number | null;
  action?: string | null;
  type?: string | null;
  timestamp?: string;
  message?: string | null;
}

export const emitDashboardUpdate = (
  organizationId: number,
  payload: DashboardUpdateEvent = {}
) => {
  try {
    if (!io || !organizationId) return;
    const eventPayload = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    };
    io.to(`org:${organizationId}`).emit("dashboard:update", eventPayload);
  } catch (err) {
    console.error(`Failed to emit dashboard:update to org:${organizationId}:`, err);
  }
};

const getAccessTokenFromCookie = (
  cookieHeader?: string
): string | null => {
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

export const verifyTokenSocket = async (
  token: string
) => {
  const decoded = jwt.verify(
    token,
    JWT_SECRET
  ) as {
    id: number;
  };

  const user = await authenticateUserSocket(
    decoded.id
  );

  return user;
};


const authenticateUserSocket = async (userId: number) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.fullname,
      u.email,
      u.organization_id,
      u.role_id,
      r.name AS role
    FROM users u
    LEFT JOIN roles r
      ON r.id = u.role_id
    WHERE u.id = $1
      AND u.is_active = TRUE
    `,
    [userId]
  );

  if (!result.rows.length) {
    throw new Error("User no longer exists");
  }

  return result.rows[0];
};