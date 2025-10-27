import { Router } from "express";
import {
  deleteCountry,
  fectchCountriesFromAPI,
  getCountriesWithFilter,
  getCountryByName,
  getStatus,
  getSummaryImage,
} from "../controllers/myControllers";

const router: Router = Router();

router.post("/countries/refresh", fectchCountriesFromAPI);
router.get("/countries/image", getSummaryImage);
router.get("/countries", getCountriesWithFilter);
router.get("/countries/:name", getCountryByName);
router.delete("/countries/:name", deleteCountry);
router.get("/status", getStatus);

export default router;
