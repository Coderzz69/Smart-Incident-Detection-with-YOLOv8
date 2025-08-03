import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import ENV from "./config/env.js";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import incidentRoutes from "./routes/incident.route.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true, limit: '10mb'}))
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/incident", incidentRoutes);


app.listen(ENV.PORT, () => {
    console.log("Server is up and running on port:", ENV.PORT);
    connectDB();
});
