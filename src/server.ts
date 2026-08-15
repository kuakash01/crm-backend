// // import dotenv to load environment variables from .env file and configure it before importing the app module to ensure that all environment variables are available when the app starts.
// import dotenv from "dotenv";
// dotenv.config();
// import { PORT } from "./config/env"

// import app from "./app";

// const PORT_NO: number = Number(PORT) || 8000;

// app.listen(PORT_NO, () => {
//   console.log(`Server is running on port ${PORT_NO}`);
// });


import dotenv from "dotenv";

dotenv.config();

import { PORT } from "./config/env";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { CORS_ORIGIN } from "./config/env";

import app from "./app";

const PORT_NO: number = Number(PORT) || 8000;

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

httpServer.listen(PORT_NO, () => {
  console.log(`Server is running on port ${PORT_NO}`);
});