import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 120,
};

interface StudentResult {
  rollNo: string;
  name: string | null;
  sgpa: string | null;
  success: boolean;
  error?: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startRoll = parseInt((req.query.start as string) || "2400430400001");
  const endRoll = parseInt((req.query.end as string) || "2400430400056");
  const session = (req.query.session as string) || "13";
  const semester = (req.query.semester as string) || "1";

  const results: StudentResult[] = [];
  let browser: any;

  try {
browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
  defaultViewport: null,
});

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto(
      "https://www.bietjhs.ac.in/result2019/GetResultodd.aspx",
      { waitUntil: "networkidle2", timeout: 30000 }
    );

    await page.select("#ddlSession", session);
    await page.select("#ddlSemester", semester);

    for (let rollNum = startRoll; rollNum <= endRoll; rollNum++) {
      const rollNo = rollNum.toString().padStart(12, "0");

      try {
        await page.evaluate((roll:any) => {
          const input = document.querySelector(
            "#txtRollNo"
          ) as HTMLInputElement;

          if (!input) return;

          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.value = roll;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }, rollNo);

        await page.click("#btnSubmit");

        await page.waitForTimeout(1500);

        const data = await page.evaluate(() => {
          const sgpaEl = document.querySelector("#lbloSGPA");
          const nameEl = document.querySelector("#lblSName");

          return {
            sgpa: sgpaEl?.textContent?.trim() || null,
            name: nameEl?.textContent?.trim() || null,
          };
        });

        results.push({
          rollNo,
          ...data,
          success: !!data.sgpa,
        });
      } catch (err: any) {
        results.push({
          rollNo,
          name: null,
          sgpa: null,
          success: false,
          error: err?.message,
        });
      }

      await delay(800);
    }

    return res.status(200).json({
      success: true,
      total: results.length,
      results,
    });
  } catch (error: any) {
    console.error("🚨 Scraping failed:", error);
    return res.status(500).json({
      success: false,
      error: error?.message,
      results,
    });
  } finally {
    if (browser) await browser.close();
  }
}
