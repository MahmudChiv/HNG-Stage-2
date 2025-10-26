// src/config/database.ts
import { Sequelize } from "sequelize-typescript";
import { Country } from "../models/Country";
import dotenv from "dotenv";
dotenv.config();

const dbURL = process.env.DB_URL;

if (!dbURL) {
  throw new Error("❌ DATABASE_URL is not defined in environment variables!");
}

export const sequelize = new Sequelize(dbURL, {
  dialect: "mysql",
  logging: false,
  models: [Country],
});