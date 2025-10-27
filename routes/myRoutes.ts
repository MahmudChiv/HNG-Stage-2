import { Router } from "express";
import { fectchCountriesFromAPI, getSummaryImage } from "../controllers/myControllers";

const router: Router = Router();

router.post("/countries/refresh", fectchCountriesFromAPI);
router.get("/countries/image", getSummaryImage);
router.get("/countries");

export default router;