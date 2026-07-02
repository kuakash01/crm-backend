import express from "express";
import cors, { CorsOptions } from "cors";
import moduleRoutes from "./modules";
import { errorMiddleware } from "./middleware/error.middleware";
import cookieParser from "cookie-parser";
import {CORS_ORIGIN} from "./config/env"


const app = express();

// 1. Define your allowed domains
const allowedOrigins: string[] = [
  CORS_ORIGIN || 'http://localhost:3000',     // Local development
  'http://127.0.0.1:3000' 
];

// 2. Configure the dynamic check with proper TypeScript types
const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow server-to-server requests or tools like Postman/cURL (where origin is undefined)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true); // Origin allowed
    } else {
      callback(new Error('Not allowed by CORS')); // Origin blocked
    }
  },
  credentials: true
};


app.use(cors(corsOptions));


app.use(express.json());
app.use(cookieParser());

// Use the router for all routes
app.use("/api", moduleRoutes);

// Global error handling middleware
app.use(errorMiddleware);

export default app;