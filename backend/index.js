// index.js

import express from "express";
import cors from "cors";
import { PORT, mongoDBURL } from "./config.js"; // Import your secret key
import mongoose from "mongoose";
import monumentRoute from "./routes/monumentRoute.js";
import galleryRoute from "./routes/galleryRoute.js";
import loginRoute from "./routes/loginRoute.js";

import authenticateToken from "./auth/authMiddleware.js";

// import authenticateToken from "./auth/authMiddleware.js"
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("uploads"));

app.get("/", (request, response) => {
  return response.status(200).send("welcome to Historical monuments project ");
});

app.use("/monuments", authenticateToken, monumentRoute);
app.use("/gallery", authenticateToken, galleryRoute);
app.use("/users", loginRoute);

mongoose
  .connect("mongodb://localhost:27017/monuments")
  .then(() => {
    console.log("app connected to database");
    app.listen(PORT, () => {
      console.log(`app is listerning to port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
