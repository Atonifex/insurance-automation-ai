# Life Insurance Quote Automation

**Real** AI-powered browser automation using OpenAI Computer Use (CUA) to get Transamerica life insurance quotes.

## 🎯 How It Works

This is **NOT a simulation** - it actually automates a browser:

1. You submit client information through the web form
2. The API launches a real Chromium browser via Playwright
3. OpenAI's Computer Use model receives screenshots and decides what to click/type
4. The browser fills out the Transamerica quote form step by step
5. The final premium is extracted and returned to you

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend   │────▶│   Next.js    │────▶│  Playwright │────▶│ Transamerica │
│   Form      │     │     API      │     │   Browser   │     │   Website    │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                           │                    │
                           │   Screenshots      │
                           ▼                    │
                    ┌──────────────┐            │
                    │   OpenAI     │◀───────────┘
                    │ Computer Use │
                    │    (CUA)     │
                    └──────────────┘
```

## 📋 Prerequisites

- **Node.js 18+**
- **OpenAI API Key** with access to `computer-use-preview` model
- **Playwright** with browsers installed
- **Local environment** (NOT Vercel/serverless - needs real browser)

## 🛠️ Installation

### 1. Clone and install dependencies

```bash
cd insurance-application-ai
npm install
```

### 2. Install Playwright browsers

```bash
npx playwright install chromium
```

### 3. Create `.env.local` file

Create a file named `.env.local` in the `insurance-application-ai` folder:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

> ⚠️ **Important**: You need an OpenAI API key with access to the `computer-use-preview` model.

### 4. Start the development server

```bash
npm run dev
```

### 5. Open in browser

Navigate to **http://localhost:3000**

## 🚀 Usage

1. Fill out all 12 fields in the form
2. Click "Get Quote"
3. **Watch the automation happen** - a browser window will open and you'll see it filling out the Transamerica form in real-time
4. Wait for the premium to be extracted and displayed

> **Note**: The browser opens in **visible mode** by default so you can watch it work. Change `headless: false` to `headless: true` in route.ts for production.

## 📁 Project Structure

```
insurance-application-ai/
├── app/
│   ├── api/
│   │   └── transamerica-quote/
│   │       └── route.ts      # OpenAI CUA + Playwright automation
│   ├── globals.css           # Tailwind styles
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Quote form UI
│   └── types.ts              # TypeScript interfaces
├── .env.local                # Your OpenAI API key (create this!)
├── package.json
└── README.md
```

## 🔄 The Computer Use Loop

The API implements the full CUA loop as specified by OpenAI:

```typescript
// Simplified flow
while (taskNotComplete) {
  // 1. Receive action from OpenAI (click, type, scroll, etc.)
  const action = await getActionFromOpenAI(screenshot);
  
  // 2. Execute action in Playwright browser
  await executeAction(page, action);
  
  // 3. Capture new screenshot
  const screenshot = await page.screenshot();
  
  // 4. Send screenshot back to OpenAI
  await sendScreenshotToOpenAI(screenshot);
}
```

## 📝 Form Fields

| Field | Type | Description |
|-------|------|-------------|
| Coverage Amount | Number | $25,000 - $10,000,000 |
| Term Length | Select | 10, 20, or 30 years |
| Payment Frequency | Select | Monthly, Quarterly, Semi-Annual, Annual |
| ZIP Code | Text | 5-digit US ZIP code |
| State | Select | US state abbreviation |
| Date of Birth | Date | Applicant's birth date (18-80 years old) |
| Gender | Select | Male or Female |
| Weight | Number | 50-500 lbs |
| Height (feet) | Number | 3-7 feet |
| Height (inches) | Number | 0-11 inches |
| Driving Record | Select | Excellent, Good, or Fair |
| Health Status | Select | Excellent, Good, or Fair |
| Nicotine Use | Select | Never, Currently, or quit timeframe |

## 🔧 Configuration

### Browser Settings (route.ts)

```typescript
// Viewport must match what you tell OpenAI
const DISPLAY_WIDTH = 1024;
const DISPLAY_HEIGHT = 768;

// Prevent infinite loops
const MAX_ITERATIONS = 50;

// Browser visibility (false = watch it work)
headless: false
```

## ⚠️ Important Notes

### This won't work on Vercel/Serverless

Serverless platforms can't run browsers. You must run this locally or on a server with:
- Full Node.js runtime
- Playwright browsers installed
- Sufficient memory/CPU for browser automation

### OpenAI Costs

Computer Use makes multiple API calls per quote (typically 10-30 iterations). Each iteration sends a screenshot. Monitor your usage.

### Safety Checks

OpenAI may return safety warnings for certain actions. The current implementation auto-acknowledges them for the demo. In production, you should review these.

### Transamerica Website Changes

If Transamerica updates their website, the automation may need adjustment. The CUA model adapts to UI changes, but major redesigns could cause issues.

## 🐛 Troubleshooting

### "Playwright browsers not installed"
```bash
npx playwright install chromium
```

### "OpenAI API key not configured"
Create `.env.local` with your key:
```env
OPENAI_API_KEY=sk-your-key-here
```

### "Could not extract premium"
- The website may have changed
- The form might require additional steps
- Check the browser window to see where it got stuck
- Increase `MAX_ITERATIONS` if needed

### Browser not opening
Check that Playwright is installed:
```bash
npx playwright install
```

## 📄 API Reference

### POST /api/transamerica-quote

**Request:**
```json
{
  "coverageAmount": 250000,
  "zipCode": "29201",
  "state": "SC",
  "dateOfBirth": "1985-06-15",
  "gender": "Male",
  "weightLbs": 170,
  "heightFeet": 5,
  "heightInches": 10,
  "drivingRecord": "Good",
  "healthStatus": "Good",
  "nicotineUse": "Never",
  "paymentFrequency": "Monthly",
  "yearsCovered": 20
}
```

**Success Response:**
```json
{
  "success": true,
  "premium": "$23.45",
  "premiumRaw": 23.45,
  "frequency": "Monthly",
  "coverageAmount": 250000,
  "yearsCovered": 20
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Automation failed",
  "details": "Could not find premium after 50 iterations"
}
```

### GET /api/transamerica-quote

Returns API status and configuration info.

## 🔐 Security

- Never commit `.env.local`
- The browser runs with limited permissions
- Consider running in a VM/container for extra isolation
- OpenAI's safety checks help prevent malicious actions

## 📜 License

MIT - Use at your own risk. This is a prototype demonstrating OpenAI Computer Use capabilities.
