import axios from "axios";
import { Request, Response } from "express";
import { Country } from "../models/Country";
import { createCanvas, loadImage } from "canvas";
import { generateSummaryImg } from "../services/generateSummaryImg";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { error } from "console";

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
    if (!countriesData)
      return res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from restcountries.com",
      });

    // 2️⃣ Fetch all exchange rates (single external request)
    const { data: currencyData } = await axios.get(
      "https://open.er-api.com/v6/latest/USD"
    );
    if (!currencyData)
      return res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from open.er-api.com",
      });

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
    });
  } catch (error: any) {
    console.error("❌ Error fetching or updating countries:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSummaryImage = async (req: Request, res: Response) => {
  try {
    const imagePath = path.join(__dirname, "../cache/summary.png");
    if (!fs.existsSync(imagePath))
      return res.status(404).json({ error: "Summary image not found" });

    return res.type('png').sendFile(imagePath);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCountriesWithFilter = async (req: Request, res: Response) => {
  try {
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Query Validation failed" });
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

    return res.status(200).json(filteredCountries);
  } catch (err) {
    console.log(`Error getting countries from DB: ${err}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCountryByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    if (!name || typeof name !== "string")
      return res.status(400).json({
        error: "Validation error",
        details: {
          name: "is required and should be a string",
        },
      });

    const countryExists = await Country.findOne({ where: { name } });
    if (!countryExists)
      return res.status(404).json({ error: "Country doesn't exist" });

    return res.status(200).json(countryExists);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCountry = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    if (!name || typeof name !== "string")
      return res.status(400).json({
        error: "Validation error",
        details: {
          name: "is required and should be a string",
        },
      });

    const countryExists = await Country.findOne({ where: { name } });
    if (!countryExists)
      return res.status(404).json({ error: "Country doesn't exist" });

    await Country.destroy({ where: { name } }).then(() =>
      res.status(200).json()
    );
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const total_countries = await Country.count();
    const latestCountry = await Country.findOne({
      order: [["last_refreshed_at", "DESC"]],
      attributes: ["last_refreshed_at"],
    });
    const last_refreshed_at = latestCountry
      ? latestCountry.last_refreshed_at
      : null;

    return res.status(200).json({
      total_countries,
      last_refreshed_at,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
