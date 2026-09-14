import multer from "multer";
import path from "node:path";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${Date.now()}${extension}`);
  },
});

const allowedTypes = ["image/jpeg", "image/png"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPG and PNG images are allowed"));
    }
    callback(null, true);
  },
});

export default upload;
