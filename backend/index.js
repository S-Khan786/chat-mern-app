import express from "express";
import dotenv from "dotenv";
import path from "path";


import userRout from "./routes/userRout.js";
import messageRout from "./routes/messageRout.js";
import userGet from './routes/search.js';
import db from './config/mongoose.js';
import cookieParser from "cookie-parser";


import {app, server} from './Socket/socket.js';

const __dirname = path.resolve();

dotenv.config();

app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 8000;

// use express router
app.use("/api/auth", userRout);
app.use("/api/message", messageRout);
app.use('/api/user', userGet);

app.use(express.static(path.join(__dirname, "/frontend/dist")));

appget("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
})

server.listen(port, (err) => {
  if (err) {
    console.log(`Error: ${err}`);
  }
  console.log(`Server is running on the port: ${port}`);
});

