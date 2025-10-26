import axios from "axios";
import { Request, Response } from "express";
import { Country } from "../models/Country";
import { createCanvas, loadImage } from "canvas";
import {generateSummaryImg} from "../services/generateSummaryImg";
import fs from "fs";
import path from "path";
import {z} from "zod";

const querySchema = z.object({
  region: z.string().optional(),
  currency: z.string().optional(),
  sort: z.string().optional(),
});

export const fectchCountriesFromAPI = async (req: Request, res: Response) => {
  try {
    await axios
      .get(
        "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
      )
      .then((response) => {
        const countriesData = response.data;
        countriesData.forEach(
          async (country: any) => {
            function random(min: number, max: number): number {
              return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            const countryExists = await Country.findOne({
              where: { name: country.name },
            });
            if (country.currencies && country.currencies.length > 0) {
              const currencyCode = country.currencies[0].code;
              await axios
                .get("https://open.er-api.com/v6/latest/USD")
                .then(async (res) => {
                  if (!res.data || !res.data.rates[currencyCode]) {
                    if (countryExists) {
                      await Country.update(
                        {
                          name: country.name,
                          capital: country.capital,
                          region: country.region,
                          population: country.population,
                          currency_code: currencyCode,
                          flag_url: country.flag,
                          last_refreshed_at: new Date(),
                        },
                        { where: { id: countryExists.id } }
                      );
                      return;
                    }

                    await Country.create({
                      name: country.name,
                      capital: country.capital,
                      region: country.region,
                      population: country.population,
                      currency_code: currencyCode,
                      flag_url: country.flag,
                      last_refreshed_at: new Date(),
                    });
                    return;
                  }
                  const currencyRate = res.data.rates[currencyCode];
                  const estimated_gdp: number =
                    (country.population * random(1000, 2000)) / currencyRate;
                  if (countryExists) {
                    await Country.update(
                      {
                        nname: country.name,
                        capital: country.capital,
                        region: country.region,
                        population: country.population,
                        currency_code: currencyCode,
                        exchange_rate: currencyRate || 0,
                        estimated_gdp,
                        flag_url: country.flag,
                        last_refreshed_at: new Date(),
                      },
                      { where: { id: countryExists.id } }
                    );
                    return;
                  }

                  await Country.create({
                    name: country.name,
                    capital: country.capital,
                    region: country.region,
                    population: country.population,
                    currency_code: currencyCode,
                    exchange_rate: currencyRate || 0,
                    estimated_gdp,
                    flag_url: country.flag,
                    last_refreshed_at: new Date(),
                  });
                }).catch (error) {
                    console.log(`Error fetching currency rates`)
                    res.status(503).json({ error: "External data source unavailable", details: "Could not fetch data from open er-api" })
                }
              return;
            }

            if (!country.currencies || country.currencies.length === 0) {
              if (countryExists) {
                await Country.update(
                  {
                    name: country.name,
                    capital: country.capital,
                    region: country.region,
                    population: country.population,
                    estimated_gdp: 0,
                    flag_url: country.flag,
                    last_refreshed_at: new Date(),
                  },
                  { where: { id: countryExists.id } }
                );
                return;
              }
              await Country.create({
                name: country.name,
                capital: country.capital,
                region: country.region,
                population: country.population,
                estimated_gdp: 0,
                flag_url: country.flag,
                last_refreshed_at: new Date(),
              });
              return;
            }
          }
        );

        generateSummaryImg();

      }).catch((error) => {
        console.log(`Error fetching countries: ${error}`);
        res.status(503).json({ "error": "External data source unavailable", "details": "Could not fetch data from restcountries.com" })
      });
    
    return res.status(200).json({ message: "Countries data fetched successfully" });
  } catch (error) {
    console.log(`Na error be this=> ${error}`);
    return res.status(500).json({ message: "Internal Server Error" });
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
      return res.status(400).json({ error: parseResult.error.errors });
    }

    const {region, currency, sort} = parseResult.data;

    const filteredCountries: Country[] = Country.findAll();
    if (region !== undefined) {
        return filteredCountries = filteredCountries.filter((country: Country) => country.region? === region)
    }
    
    if (currency !== undefined) {
        return filteredCountries = filteredCountries.filter((country: Country) => country.currency_code? === currrency)
    }

    if (sort !== undefined && sort="gdp_desc") {
        return filteredCountries = filteredCountries.sort((a: Country, b: Country) => b.estimated_gdp - a.estimated_gdp)
    }

    if (!region && !currency && !sort) return res.status(200).json({filteredCountries});

    res.status(200).json({filteredCountries})
  } catch (err) {
    console.log(`Error getting countries from DB: ${err}`);

  }
}
