// import dotenv to load environment variables from .env file and configure it before importing the app module to ensure that all environment variables are available when the app starts.
import dotenv from "dotenv";
dotenv.config();
import { PORT } from "./config/env"

import app from "./app";

const PORT_NO: number = Number(PORT) || 8000;

app.listen(PORT_NO, () => {
  console.log(`Server is running on port ${PORT_NO}`);
});