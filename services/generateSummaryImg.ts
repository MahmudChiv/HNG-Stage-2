import {Country} from "../models/Country";
import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";

export async function generateSummaryImg() {
  try {
    //Generating Summary Data
    const totalCountries = await Country.count();
    const topCountries = await Country.findAll({
        order: [["estimated_gdp", "DESC"]],
        limit: 5,
    });

    //Generating Summary Image
    const width = 1000;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Image Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Header text
    ctx.fillStyle = "#000000";
    ctx.font = "bold 24px Arial";
    ctx.fillText("🌍 Country Summary", 20, 40);

    // Total countries
    ctx.font = "18px Arial";
    ctx.fillText(`Total countries: ${totalCountries}`, 20, 80);

    // Top 5 by GDP
    ctx.fillText("Top 5 by GDP:", 20, 120);
    topCountries.forEach((c, i) => {
        ctx.fillText(
          `${i + 1}. ${c.name} - ${c.estimated_gdp.toLocaleString()}`,
          40,
          150 + i * 30
        );
    });

    // Timestamp
    const lastRefreshedAt = topCountries[0]?.last_refreshed_at;
    ctx.fillText(`Last refreshed: ${lastRefreshedAt}`, 20, 330);

    const outputPath = path.join(__dirname, "../cache/summary.png");
    const buffer = canvas.toBuffer("image/png");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  } catch (err) {
    console.log(`Error generating Image: ${err}`)
  }
}