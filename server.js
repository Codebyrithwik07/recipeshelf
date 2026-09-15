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

app.post(
  "/api/recipes/:recipeId/cover",
  upload.single("image"),
  (req, res) => {
    const recipe = recipes.find((item) => item.id === req.params.recipeId);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    const localUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    recipe.coverUrl = localUrl;

    return res.status(201).json({
      recipeId: recipe.id,
      coverUrl: localUrl,
    });
  }
);

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Cover image is too large" });
    }

    return res.status(400).json({ message: error.message });
  }

  if (error.message === "Unsupported file") {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`RecipeShelf API running on http://localhost:${port}`);
});
