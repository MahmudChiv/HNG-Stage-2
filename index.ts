import express from "express";
import dotenv from "dotenv";
dotenv.config();
import myRoutes from "./routes/myRoutes"
import { sequelize } from "./config/database";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", myRoutes)

app.get("/", (req, res) => res.send("API is running..."));

sequelize.sync().then(() => {
  console.log("✅ Database synced");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

