// src/config/database.ts
import { Sequelize } from "sequelize-typescript";
import { Country } from "../models/Country";
import dotenv from "dotenv";
dotenv.config();



export const sequelize = new Sequelize(process.env.DB_URL!, {
  dialect: "mysql",
  logging: false,
  models: [Country],
});