import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import upload from "./config/upload.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/upload", upload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Avatar file is required" });
  }

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  return res.status(201).json({ url });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Avatar must be 5 MB or smaller" });
    }
    return res.status(400).json({ message: error.message });
  }

  if (error.message === "Only JPG and PNG images are allowed") {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`Threadbase upload API running on http://localhost:${port}`);
});
