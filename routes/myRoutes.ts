import { Router } from "express";
import { fectchCountriesFromAPI, getCountriesWithFilter, getSummaryImage } from "../controllers/myControllers";

const router: Router = Router();

router.post("/countries/refresh", fectchCountriesFromAPI);
router.get("/countries/image", getSummaryImage);
router.get("/countries", getCountriesWithFilter);

export default router;