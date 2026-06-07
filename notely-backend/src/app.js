const express = require("express");
const cors = require("cors");
const notesRoutes = require("./routes/notes.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/notes", notesRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;