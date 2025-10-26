// src/config/database.ts
import { Sequelize } from "sequelize-typescript";
import { Country } from "../models/Country";

export const sequelize = new Sequelize({
  dialect: "mysql",
  host: "localhost",
  username: "root",
  password: "password",
  database: "ecommerce_db",
  models: [Country],
  logging: true,
});
