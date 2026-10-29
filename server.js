import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import upload from "./config/upload.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure Cloudinary from process.env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const recipes = [
  {
    id: "r1",
    title: "Roasted Tomato Pasta",
    coverUrl: null,
    coverPublicId: null,
  },
  {
    id: "r2",
    title: "Lemon Rice Bowl",
    coverUrl: null,
    coverPublicId: null,
  },
];

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "RecipeShelf" });
});

app.get("/api/recipes", (req, res) => {
  res.json({ recipes });
});

app.get("/api/recipes/:recipeId", (req, res) => {
  const recipe = recipes.find((item) => item.id === req.params.recipeId);

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  return res.json({ recipe });
});

// Upload Cover Endpoint
app.post(
  "/api/recipes/:recipeId/cover",
  // 1. Fixed field name from "image" to "cover"
  upload.single("cover"),
  async (req, res, next) => {
    try {
      // 2. Check if recipe exists FIRST before attempting cloud upload (404)
      const recipe = recipes.find((item) => item.id === req.params.recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      // 3. Return 400 if file is missing
      if (!req.file) {
        return res.status(400).json({ message: "Cover image is required" });
      }

      // Keep track of previous public_id for post-upload cleanup
      const oldPublicId = recipe.coverPublicId;

      // 4. Stream req.file.buffer to Cloudinary
      const uploadStream = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "recipeshelf/covers",
              resource_type: "image",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
      };

      let result;
      try {
        result = await uploadStream();
      } catch (uploadError) {
        // Return 502 Bad Gateway for Cloudinary failures
        return res.status(502).json({ message: "Cloudinary upload failed" });
      }

      // 5. Update recipe state with secure_url and public_id
      recipe.coverUrl = result.secure_url;
      recipe.coverPublicId = result.public_id;

      // 6. Delete previous cover asset ONLY AFTER saving new state safely
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (destroyError) {
          console.error("Failed to delete previous cover:", destroyError);
        }
      }

      // 7. Return status 201 with exact expected body shape
      return res.status(201).json({
        recipeId: recipe.id,
        coverUrl: recipe.coverUrl,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Centralized Error Handling Middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Cover image is too large" });
    }
    return res.status(400).json({ message: error.message });
  }

  if (error.statusCode === 400 || error.message === "Unsupported file") {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`RecipeShelf API running on http://localhost:${port}`);
});