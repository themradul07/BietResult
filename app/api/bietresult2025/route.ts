import { NextResponse } from "next/server";

// Dynamic imports for env compatibility
// const isDev = process.env.NODE_ENV === 'development';
const isDev = true;

let puppeteer: any, chromium: any;
if (isDev) {
  puppeteer = (await import('puppeteer')).default;
} 

export const maxDuration = 120;

interface StudentResult {
  rollNo: string;
  name: string | null;
  sgpa: string | null;
  success: boolean;
  error?: string;
}

// ✅ Helper for delays (replaces waitForTimeout)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startRoll = parseInt(searchParams.get("start") || "2400430400001");
  const endRoll = parseInt(searchParams.get("end") || "2400430400056");
  const session = searchParams.get("session") || "13";
  const semester = searchParams.get("semester") || "1";

  const results: StudentResult[] = [];

  let browser;
  try {
    const launchOptions: any = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      headless: 'new',
    };

    if (!isDev) {
      launchOptions.executablePath = await chromium.executablePath();
      launchOptions.defaultViewport = chromium.defaultViewport;
      launchOptions.args.push(...chromium.args);
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    if (!isDev) await page.setViewport({ width: 1366, height: 768 });

    await page.goto("https://www.bietjhs.ac.in/result2019/GetResultodd.aspx", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.select("#ddlSession", session);
    await page.select("#ddlSemester", semester);

    for (let rollNum = startRoll; rollNum <= endRoll; rollNum++) {
      const rollNo = rollNum.toString().padStart(12, '0');

      try {
        // Clear & type roll number
        await page.evaluate((roll: any) => {
          const input = document.querySelector('#txtRollNo') as HTMLInputElement;
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.value = roll;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, rollNo);

        await page.click("#btnSubmit", { force: true });
        
        // Wait for response or selector
        await Promise.race([
          page.waitForResponse((resp:any) => resp.url().includes('GetResultodd') && resp.status() < 400, { timeout: 15000 }),
          page.waitForSelector("#lbloSGPA, #lblSName", { timeout: 10000 })
        ]).catch(() => null);

        await delay(1500);  // ✅ Fixed: Replaces waitForTimeout

        const data = await page.evaluate(() => {
          const sgpaEl = document.querySelector("#lbloSGPA") as HTMLElement;
          const nameEl = document.querySelector("#lblSName") as HTMLElement;
          return {
            sgpa: sgpaEl?.textContent?.trim() || null,
            name: nameEl?.textContent?.trim() || null,
          };
        });

        results.push({ 
          rollNo, 
          ...data, 
          success: !!data.sgpa 
        });
        console.log(`✅ ${rollNo}: ${data.sgpa || 'No result'}`);

      } catch (rollError: any) {
        console.error(`❌ ${rollNo}:`, rollError.message);
        results.push({
          rollNo,
          name: null,
          sgpa: null,
          success: false,
          error: rollError.message?.slice(0, 100),
        });
      }

      await delay(800);  // ✅ Fixed: Rate limit
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      results,
      summary: {
        processed: results.length,
        success: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });

  } catch (error: any) {
    console.error("🚨 Scraping failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error", results },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
