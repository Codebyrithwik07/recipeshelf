import multer from "multer";
import path from "node:path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const allowedMimeTypes = ["image/jpeg", "image/png"];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    const error = new Error("Invalid file type. Only JPG and PNG are allowed.");
    error.statusCode = 400;
    callback(error, false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter
  },
);

export default upload;
