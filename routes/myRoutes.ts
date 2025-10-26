import { Router } from "express";
import { fectchCountriesFromAPI } from "../controllers/myControllers";

const router: Router = Router();

router.post("/countries/refresh", fectchCountriesFromAPI);

export default router;