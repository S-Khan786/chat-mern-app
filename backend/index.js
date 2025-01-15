import express from "express";
import dotenv from "dotenv";


import indexRoutes from "./routes/index.js";
import db from './config/mongoose.js';


const app = express();
dotenv.config();

const port = process.env.PORT || 8000;

// use express router
app.use("/", indexRoutes);

app.listen(port, (err) => {
  if (err) {
    console.log(`Error: ${err}`);
  }
  console.log(`Server is running on the port: ${port}`);
});

