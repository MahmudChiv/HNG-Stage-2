import axios from "axios";
import { Request, Response } from "express";
import { Country } from "../models/Country";
import { createCanvas, loadImage } from "canvas";
import { generateSummaryImg } from "../services/generateSummaryImg";
import fs from "fs";
import path from "path";
import { z } from "zod";

const querySchema = z.object({
  region: z.string().optional(),
  currency: z.string().optional(),
  sort: z.string().optional(),
});

export const fectchCountriesFromAPI = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Fetch all countries (single external request)
    const { data: countriesData } = await axios.get(
      "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
    );

    // 2️⃣ Fetch all exchange rates (single external request)
    const { data: currencyData } = await axios.get(
      "https://open.er-api.com/v6/latest/USD"
    );
    const rates = currencyData.rates;

    // 3️⃣ Helper function to generate random GDP multiplier
    const random = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    // 4️⃣ Prepare array of country data
    const countriesToSave = countriesData.map((country: any) => {
      let currencyCode = null;
      let exchangeRate = null;
      let estimated_gdp = 0;

      if (country.currencies && country.currencies.length > 0) {
        currencyCode = country.currencies[0].code;
        if (rates[currencyCode]) {
          exchangeRate = rates[currencyCode];
          estimated_gdp =
            (country.population * random(1000, 2000)) / exchangeRate;
        }
      }

      return {
        name: country.name,
        capital: country.capital,
        region: country.region,
        population: country.population,
        currency_code: currencyCode,
        exchange_rate: exchangeRate,
        estimated_gdp,
        flag_url: country.flag,
        last_refreshed_at: new Date(),
      };
    });

    // 5️⃣ Bulk insert or update existing countries
    await Country.bulkCreate(countriesToSave, {
      updateOnDuplicate: [
        "capital",
        "region",
        "population",
        "currency_code",
        "exchange_rate",
        "estimated_gdp",
        "flag_url",
        "last_refreshed_at",
      ],
    });

    // 6️⃣ Generate summary image (if applicable)
    await generateSummaryImg();

    // ✅ 7️⃣ Return a single response
    return res.status(200).json({
      message: "Countries data fetched and updated successfully",
      totalCountries: countriesToSave.length,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("❌ Error fetching or updating countries:", error.message);
    return res.status(500).json({
      error: "Failed to fetch or update countries",
      details: error.message,
    });
  }
};



export const getSummaryImage = async (req: Request, res: Response) => {
  try {
    const imagePath = path.join(__dirname, "../cache/summary.png");
    if (!fs.existsSync(imagePath))
      return res.status(404).json({ error: "Summary image not found" });

    return res.sendFile(imagePath);
  } catch (error) {
    console.error("Error retrieving summary image:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCountriesWithFilter = async (req: Request, res: Response) => {
  try {
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error });
    }

    const { region, currency, sort } = parseResult.data;

    let filteredCountries: Country[] = await Country.findAll();
    if (region !== undefined) {
      filteredCountries = filteredCountries.filter(
        (country: Country) => country.region === region
      );
    }

    if (currency !== undefined) {
      filteredCountries = filteredCountries.filter(
        (country: Country) => country.currency_code === currency
      );
    }

    if (sort !== undefined && sort === "gdp_desc") {
      filteredCountries = filteredCountries.sort(
        (a: Country, b: Country) => b.estimated_gdp - a.estimated_gdp
      );
    }

    if (!region && !currency && !sort)
      return res.status(200).json({ filteredCountries });

    return res.status(200).json({ filteredCountries });
  } catch (err) {
    console.log(`Error getting countries from DB: ${err}`);
  }
};
