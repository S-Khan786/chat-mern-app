import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import userRout from "./routes/userRout.js";
import messageRout from "./routes/messageRout.js";
import userGet from './routes/search.js';
import { app, server } from './Socket/socket.js';
import dbConnect from "./config/mongoose.js";

// Load environment variables
dotenv.config();

const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 8000;

// Use express router
app.use("/api/auth", userRout);
app.use("/api/message", messageRout);
app.use('/api/user', userGet);

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

const startServer = async () => {
  try {
    await dbConnect();
    server.listen(port, () => console.log(`Server is running on port ${port}`));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();


