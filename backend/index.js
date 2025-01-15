import express from "express";
import indexRoutes from "./routes/index.js";
import dotenv from "dotenv";

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
