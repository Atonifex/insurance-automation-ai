# Life Insurance Quote Automation

AI-powered browser automation for getting instant Transamerica life insurance quotes.

## 🚀 Features

- **Clean Form Interface**: Professional UI for collecting all required quote information
- **Real-time Validation**: Client-side validation with helpful error messages
- **AI Automation**: Uses OpenAI Computer Use or Playwright for browser automation
- **Demo Mode**: Works without API key using simulated premium calculations
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional - runs in demo mode without it)

## 🛠️ Installation

1. **Clone and navigate to the project:**
   ```bash
   cd insurance-application-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers (for production automation):**
   ```bash
   npx playwright install chromium
   ```

4. **Create environment file:**
   Create a `.env.local` file in the root directory:
   ```env
   # OpenAI API Key for Computer Use automation
   # Get your key from: https://platform.openai.com/api-keys
   OPENAI_API_KEY=your-api-key-here
   
   # Optional: Set to 'production' in deployment
   NODE_ENV=development
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
insurance-application-ai/
├── app/
│   ├── api/
│   │   └── transamerica-quote/
│   │       └── route.ts      # API endpoint for quote automation
│   ├── globals.css           # Global styles with Tailwind
│   ├── layout.tsx            # Root layout with metadata
│   ├── page.tsx              # Landing page with quote form
│   └── types.ts              # TypeScript type definitions
├── .env.local                # Environment variables (create this)
├── package.json
└── README.md
```

## 🎯 How It Works

### Frontend Flow
1. Insurance agent fills out the 12-field quote form
2. Client-side validation ensures all data is correct
3. Form submits to `/api/transamerica-quote` endpoint
4. Loading state displays while automation runs
5. Quote result appears below the form

### Backend Flow
1. API route validates incoming form data
2. If `OPENAI_API_KEY` is set:
   - Attempts OpenAI Computer Use automation
   - Falls back to Playwright automation if needed
3. If no API key (demo mode):
   - Returns simulated premium based on input factors
4. Response includes formatted premium and quote details

### Form Fields

| Field | Type | Description |
|-------|------|-------------|
| Coverage Amount | Number | USD coverage (min $25,000) |
| Term Length | Select | 10, 20, or 30 years |
| Payment Frequency | Select | Monthly, Quarterly, Semi-Annual, Annual |
| ZIP Code | Text | 5-digit US ZIP code |
| State | Select | US state abbreviation |
| Date of Birth | Date | Applicant's birth date |
| Gender | Select | Male or Female |
| Weight | Number | Weight in pounds |
| Height (feet) | Number | Height feet component |
| Height (inches) | Number | Height inches component (0-11) |
| Driving Record | Select | Excellent, Good, or Fair |
| Health Status | Select | Excellent, Good, or Fair |
| Nicotine Use | Select | Usage history options |

## 🔒 Security Notes

- Never commit `.env.local` to version control
- API keys are only used server-side
- Sensitive data is not logged in production
- Form validation prevents malicious input

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub repository
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variable:
   - `OPENAI_API_KEY`: Your OpenAI API key
4. Deploy

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Enables AI automation (demo mode without) |
| `NODE_ENV` | No | Set to `production` for deployment |

## 🧪 Testing

### Demo Mode
Without an API key, the app runs in demo mode:
- Form submission works normally
- Backend calculates simulated premium based on:
  - Coverage amount
  - Age (from date of birth)
  - Health status
  - Nicotine use
  - Term length
  - Gender

### Production Mode
With a valid API key:
- Attempts real browser automation
- Navigates Transamerica quote page
- Fills form with provided data
- Extracts actual premium

## 📝 API Reference

### POST /api/transamerica-quote

**Request Body:**
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
  "premium": "$13.18",
  "premiumRaw": 13.18,
  "frequency": "Monthly",
  "coverageAmount": 250000,
  "yearsCovered": 20
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": "ZIP code must be exactly 5 digits"
}
```

### GET /api/transamerica-quote

Returns API information and status.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📄 License

MIT License - Feel free to use this prototype for your insurance automation needs.

## 🤝 Contributing

This is a demo prototype. For production use:
1. Add comprehensive error handling
2. Implement rate limiting
3. Add logging and monitoring
4. Consider queueing for long-running automation
5. Add authentication for the API endpoint
