import express from "express";
import cors, { CorsOptions } from "cors";
import moduleRoutes from "./modules";
import { errorMiddleware } from "./middleware/error.middleware";
import cookieParser from "cookie-parser";
import { CORS_ORIGIN } from "./config/env";

const app = express();

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow server-to-server requests, Postman, cURL, etc.
    if (!origin) return callback(null, true);

    if (origin === CORS_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use("/api", moduleRoutes);

app.use(errorMiddleware);

export default app;