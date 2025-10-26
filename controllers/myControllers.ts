import axios from "axios";
import { Request, Response } from "express";
import { Country } from "../models/Country";

export const fectchCountriesFromAPI = async (req: Request, res: Response) => {
    try {
        const getCountries = await axios.get(
          "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
        ).then((response) => console.log(response.data));

        const getExchangeRate = "";
    } catch (error) {
        console.log(`Na error be this=> ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}