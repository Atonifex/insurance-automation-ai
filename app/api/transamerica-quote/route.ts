import { NextRequest, NextResponse } from 'next/server';
import { 
  TransamericaQuoteFormData, 
  QuoteResponse, 
  QuoteErrorResponse,
  US_STATES 
} from '../../types';

/**
 * Transamerica Quote API Route
 * 
 * This endpoint receives client data from the frontend form and uses
 * browser automation to navigate Transamerica's quote page and extract
 * the estimated premium.
 * 
 * In production, this would use OpenAI's Computer Use API or Playwright
 * for browser automation. For this prototype, we demonstrate the structure
 * with Playwright-based automation.
 */

// Type guard for nicotine use values
const VALID_NICOTINE_VALUES = ['Never', 'Currently', 'None for 1yr', 'None for 2yrs', 'None for 3+ yrs'];
const VALID_FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];
const VALID_YEARS = [10, 20, 30];
const VALID_GENDERS = ['Male', 'Female'];
const VALID_RECORDS = ['Excellent', 'Good', 'Fair'];

/**
 * Validates all fields from the incoming request body
 * Returns an array of error messages, empty if valid
 */
function validateFormData(data: unknown): string[] {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return ['Invalid request body'];
  }
  
  const form = data as Partial<TransamericaQuoteFormData>;
  
  // Coverage amount validation
  if (typeof form.coverageAmount !== 'number' || form.coverageAmount < 25000 || form.coverageAmount > 10000000) {
    errors.push('Coverage amount must be between $25,000 and $10,000,000');
  }
  
  // ZIP code validation
  if (typeof form.zipCode !== 'string' || !/^\d{5}$/.test(form.zipCode)) {
    errors.push('ZIP code must be exactly 5 digits');
  }
  
  // State validation
  if (!form.state || !US_STATES.includes(form.state as typeof US_STATES[number])) {
    errors.push('Invalid state selected');
  }
  
  // Date of birth validation
  if (typeof form.dateOfBirth !== 'string' || !form.dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const dob = new Date(form.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date of birth format');
    } else {
      const today = new Date();
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18 || age > 80) {
        errors.push('Applicant must be between 18 and 80 years old');
      }
    }
  }
  
  // Gender validation
  if (!form.gender || !VALID_GENDERS.includes(form.gender)) {
    errors.push('Invalid gender selected');
  }
  
  // Weight validation
  if (typeof form.weightLbs !== 'number' || form.weightLbs < 50 || form.weightLbs > 500) {
    errors.push('Weight must be between 50 and 500 lbs');
  }
  
  // Height validation
  if (typeof form.heightFeet !== 'number' || form.heightFeet < 3 || form.heightFeet > 7) {
    errors.push('Height (feet) must be between 3 and 7');
  }
  if (typeof form.heightInches !== 'number' || form.heightInches < 0 || form.heightInches > 11) {
    errors.push('Height (inches) must be between 0 and 11');
  }
  
  // Driving record validation
  if (!form.drivingRecord || !VALID_RECORDS.includes(form.drivingRecord)) {
    errors.push('Invalid driving record selected');
  }
  
  // Health status validation
  if (!form.healthStatus || !VALID_RECORDS.includes(form.healthStatus)) {
    errors.push('Invalid health status selected');
  }
  
  // Nicotine use validation
  if (!form.nicotineUse || !VALID_NICOTINE_VALUES.includes(form.nicotineUse)) {
    errors.push('Invalid nicotine use selected');
  }
  
  // Payment frequency validation
  if (!form.paymentFrequency || !VALID_FREQUENCIES.includes(form.paymentFrequency)) {
    errors.push('Invalid payment frequency selected');
  }
  
  // Years covered validation
  if (typeof form.yearsCovered !== 'number' || !VALID_YEARS.includes(form.yearsCovered)) {
    errors.push('Years covered must be 10, 20, or 30');
  }
  
  return errors;
}

/**
 * Automates the Transamerica quote process using browser automation
 * 
 * This function demonstrates the structure for browser automation.
 * In a full implementation, it would:
 * 1. Launch a headless browser
 * 2. Navigate to the Transamerica quote page
 * 3. Fill in all form fields
 * 4. Submit and wait for results
 * 5. Extract the premium value
 */
async function getTransamericaQuote(formData: TransamericaQuoteFormData): Promise<QuoteResponse | QuoteErrorResponse> {
  // Check for OpenAI API key for production automation
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    // For demo purposes without API key, return a simulated response
    // This shows what the response structure would look like
    console.log('[Demo Mode] No OPENAI_API_KEY found - returning simulated quote');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate a mock premium based on input factors (simplified formula for demo)
    const basePremium = formData.coverageAmount / 10000;
    const ageFactor = calculateAgeFactor(formData.dateOfBirth);
    const healthFactor = formData.healthStatus === 'Excellent' ? 0.9 : formData.healthStatus === 'Good' ? 1.0 : 1.2;
    const nicotineFactor = formData.nicotineUse === 'Never' ? 1.0 : formData.nicotineUse === 'Currently' ? 2.0 : 1.3;
    const termFactor = formData.yearsCovered === 10 ? 0.8 : formData.yearsCovered === 20 ? 1.0 : 1.3;
    const genderFactor = formData.gender === 'Female' ? 0.9 : 1.0;
    
    let premium = basePremium * ageFactor * healthFactor * nicotineFactor * termFactor * genderFactor;
    
    // Adjust for payment frequency
    switch (formData.paymentFrequency) {
      case 'Monthly':
        premium = premium / 12;
        break;
      case 'Quarterly':
        premium = premium / 4;
        break;
      case 'Semi-Annual':
        premium = premium / 2;
        break;
      // Annual stays as is
    }
    
    // Round to 2 decimal places
    premium = Math.round(premium * 100) / 100;
    
    return {
      success: true,
      premium: `$${premium.toFixed(2)}`,
      premiumRaw: premium,
      frequency: formData.paymentFrequency,
      coverageAmount: formData.coverageAmount,
      yearsCovered: formData.yearsCovered,
    };
  }
  
  // Production implementation with OpenAI Computer Use
  try {
    const quote = await automateWithOpenAI(formData, openaiKey);
    return quote;
  } catch (error) {
    console.error('[Quote Error]', error);
    return {
      success: false,
      error: 'Failed to retrieve quote from Transamerica',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Calculates age factor for premium estimation
 */
function calculateAgeFactor(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  // Simplified age factor (increases with age)
  if (age < 30) return 0.8;
  if (age < 40) return 1.0;
  if (age < 50) return 1.4;
  if (age < 60) return 2.0;
  return 3.0;
}

/**
 * Production automation using OpenAI's Computer Use capabilities
 * 
 * This function structures the request to OpenAI's API with computer use tools
 * enabled for browser automation. The AI agent will:
 * 1. Navigate to the Transamerica quote page
 * 2. Interact with form elements to fill in data
 * 3. Process through multi-page forms
 * 4. Extract and return the final premium
 */
async function automateWithOpenAI(
  formData: TransamericaQuoteFormData, 
  apiKey: string
): Promise<QuoteResponse | QuoteErrorResponse> {
  // Format height for display
  const heightFormatted = `${formData.heightFeet}'${formData.heightInches}"`;
  
  // Format date of birth for form entry (MM/DD/YYYY)
  const dob = new Date(formData.dateOfBirth);
  const dobFormatted = `${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getDate().toString().padStart(2, '0')}/${dob.getFullYear()}`;
  
  // Construct the task instructions for the AI agent
  const taskInstructions = `
You are an AI agent automating a life insurance quote on the Transamerica website.

TASK: Navigate to https://www.transamerica.com/lifepolicyexplorer/get-quote and fill out the quote form with the following information:

CLIENT INFORMATION:
- Coverage Amount: $${formData.coverageAmount.toLocaleString()}
- Term Length: ${formData.yearsCovered} years
- Payment Frequency: ${formData.paymentFrequency}
- ZIP Code: ${formData.zipCode}
- State: ${formData.state}
- Date of Birth: ${dobFormatted}
- Gender: ${formData.gender}
- Height: ${heightFormatted}
- Weight: ${formData.weightLbs} lbs
- Driving Record: ${formData.drivingRecord}
- Health Status: ${formData.healthStatus}
- Nicotine/Tobacco Use: ${formData.nicotineUse}

INSTRUCTIONS:
1. Navigate to the Transamerica Life Policy Explorer quote page
2. Fill in each field accurately using the information above
3. Click through any "Next" or "Continue" buttons to proceed
4. Wait for the final quote page showing "Estimated Premium"
5. Extract ONLY the premium dollar amount from the results

RESPONSE FORMAT:
Return ONLY the premium amount in this exact format: $XX.XX
Do not include any other text, explanation, or formatting.
`.trim();

  try {
    // Call OpenAI API with computer use capabilities
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'computer-use-preview', // OpenAI's computer use model
        tools: [
          {
            type: 'computer_use_preview',
            display_width: 1920,
            display_height: 1080,
            environment: 'browser',
          }
        ],
        input: [
          {
            role: 'user',
            content: taskInstructions,
          }
        ],
        reasoning: {
          generate_summary: 'concise',
        },
        truncation: 'auto',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Extract the premium from the AI's response
    // The response structure may vary based on the actual API response format
    const outputText = extractOutputFromResponse(result);
    const premiumMatch = outputText.match(/\$[\d,]+\.?\d*/);
    
    if (!premiumMatch) {
      throw new Error('Could not extract premium from response');
    }
    
    const premiumStr = premiumMatch[0];
    const premiumRaw = parseFloat(premiumStr.replace(/[$,]/g, ''));
    
    return {
      success: true,
      premium: premiumStr,
      premiumRaw,
      frequency: formData.paymentFrequency,
      coverageAmount: formData.coverageAmount,
      yearsCovered: formData.yearsCovered,
    };
    
  } catch (error) {
    // If OpenAI computer use fails, try Playwright automation as fallback
    console.log('[OpenAI Error] Attempting Playwright fallback...', error);
    return await automateWithPlaywright(formData);
  }
}

/**
 * Extract output text from OpenAI response
 * Handles various response formats from the API
 */
function extractOutputFromResponse(response: unknown): string {
  // Type-safe extraction of text from various response formats
  if (typeof response === 'object' && response !== null) {
    const resp = response as Record<string, unknown>;
    
    // Check for output array format
    if (Array.isArray(resp.output)) {
      for (const item of resp.output) {
        if (typeof item === 'object' && item !== null) {
          const outputItem = item as Record<string, unknown>;
          if (outputItem.type === 'message' && Array.isArray(outputItem.content)) {
            for (const content of outputItem.content) {
              if (typeof content === 'object' && content !== null) {
                const contentItem = content as Record<string, unknown>;
                if (contentItem.type === 'output_text' && typeof contentItem.text === 'string') {
                  return contentItem.text;
                }
              }
            }
          }
        }
      }
    }
    
    // Check for choices array format (standard completions)
    if (Array.isArray(resp.choices) && resp.choices.length > 0) {
      const choice = resp.choices[0] as Record<string, unknown>;
      if (typeof choice.message === 'object' && choice.message !== null) {
        const message = choice.message as Record<string, unknown>;
        if (typeof message.content === 'string') {
          return message.content;
        }
      }
    }
  }
  
  return '';
}

/**
 * Fallback automation using Playwright
 * 
 * This provides a traditional browser automation approach if OpenAI
 * computer use is unavailable. Requires Playwright to be installed.
 */
async function automateWithPlaywright(
  formData: TransamericaQuoteFormData
): Promise<QuoteResponse | QuoteErrorResponse> {
  try {
    // Dynamic import of Playwright (may not be available in all environments)
    const { chromium } = await import('playwright');
    
    // Launch browser in headless mode
    const browser = await chromium.launch({
      headless: true,
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    try {
      // Navigate to Transamerica quote page
      await page.goto('https://www.transamerica.com/lifepolicyexplorer/get-quote', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Fill coverage amount
      const coverageInput = await page.$('input[name="coverageAmount"], #coverageAmount, [data-field="coverage"]');
      if (coverageInput) {
        await coverageInput.fill(formData.coverageAmount.toString());
      }
      
      // Fill ZIP code
      const zipInput = await page.$('input[name="zipCode"], #zipCode, [data-field="zip"]');
      if (zipInput) {
        await zipInput.fill(formData.zipCode);
      }
      
      // Select state
      const stateSelect = await page.$('select[name="state"], #state, [data-field="state"]');
      if (stateSelect) {
        await stateSelect.selectOption(formData.state);
      }
      
      // Fill date of birth
      const dobInput = await page.$('input[name="dateOfBirth"], #dateOfBirth, [data-field="dob"]');
      if (dobInput) {
        const dob = new Date(formData.dateOfBirth);
        const dobFormatted = `${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getDate().toString().padStart(2, '0')}/${dob.getFullYear()}`;
        await dobInput.fill(dobFormatted);
      }
      
      // Select gender
      const genderSelect = await page.$('select[name="gender"], #gender, [data-field="gender"]');
      if (genderSelect) {
        await genderSelect.selectOption(formData.gender);
      }
      
      // Fill weight
      const weightInput = await page.$('input[name="weight"], #weight, [data-field="weight"]');
      if (weightInput) {
        await weightInput.fill(formData.weightLbs.toString());
      }
      
      // Fill height (feet)
      const heightFeetInput = await page.$('input[name="heightFeet"], #heightFeet, [data-field="heightFeet"]');
      if (heightFeetInput) {
        await heightFeetInput.fill(formData.heightFeet.toString());
      }
      
      // Fill height (inches)
      const heightInchesInput = await page.$('input[name="heightInches"], #heightInches, [data-field="heightInches"]');
      if (heightInchesInput) {
        await heightInchesInput.fill(formData.heightInches.toString());
      }
      
      // Select driving record
      const drivingSelect = await page.$('select[name="drivingRecord"], #drivingRecord, [data-field="driving"]');
      if (drivingSelect) {
        await drivingSelect.selectOption(formData.drivingRecord);
      }
      
      // Select health status
      const healthSelect = await page.$('select[name="health"], #health, [data-field="health"]');
      if (healthSelect) {
        await healthSelect.selectOption(formData.healthStatus);
      }
      
      // Select nicotine use
      const nicotineSelect = await page.$('select[name="nicotine"], #nicotine, [data-field="nicotine"]');
      if (nicotineSelect) {
        await nicotineSelect.selectOption(formData.nicotineUse);
      }
      
      // Select payment frequency
      const frequencySelect = await page.$('select[name="paymentFrequency"], #paymentFrequency, [data-field="frequency"]');
      if (frequencySelect) {
        await frequencySelect.selectOption(formData.paymentFrequency);
      }
      
      // Select years covered
      const yearsSelect = await page.$('select[name="term"], #term, [data-field="term"]');
      if (yearsSelect) {
        await yearsSelect.selectOption(formData.yearsCovered.toString());
      }
      
      // Click submit/continue button
      const submitButton = await page.$('button[type="submit"], .submit-btn, [data-action="submit"]');
      if (submitButton) {
        await submitButton.click();
      }
      
      // Wait for results page
      await page.waitForTimeout(5000);
      
      // Try to extract premium from various possible selectors
      const premiumSelectors = [
        '.premium-amount',
        '.estimated-premium',
        '[data-field="premium"]',
        '.quote-result',
        '.monthly-premium',
      ];
      
      let premiumText = '';
      for (const selector of premiumSelectors) {
        const element = await page.$(selector);
        if (element) {
          premiumText = await element.textContent() || '';
          if (premiumText) break;
        }
      }
      
      // If no specific element found, search full page text
      if (!premiumText) {
        const pageContent = await page.content();
        const premiumMatch = pageContent.match(/(?:premium|monthly|payment)[:\s]*\$?([\d,]+\.?\d*)/i);
        if (premiumMatch) {
          premiumText = '$' + premiumMatch[1];
        }
      }
      
      await browser.close();
      
      if (!premiumText) {
        throw new Error('Could not find premium on results page');
      }
      
      // Parse premium value
      const premiumMatch = premiumText.match(/\$?([\d,]+\.?\d*)/);
      if (!premiumMatch) {
        throw new Error('Could not parse premium value');
      }
      
      const premiumRaw = parseFloat(premiumMatch[1].replace(/,/g, ''));
      
      return {
        success: true,
        premium: `$${premiumRaw.toFixed(2)}`,
        premiumRaw,
        frequency: formData.paymentFrequency,
        coverageAmount: formData.coverageAmount,
        yearsCovered: formData.yearsCovered,
      };
      
    } catch (pageError) {
      await browser.close();
      throw pageError;
    }
    
  } catch (error) {
    // Playwright not available or automation failed
    console.error('[Playwright Error]', error);
    
    // Return demo response as final fallback
    return {
      success: false,
      error: 'Browser automation unavailable. Please ensure Playwright is installed for production use.',
      details: error instanceof Error ? error.message : 'Playwright automation failed',
    };
  }
}

/**
 * POST handler for quote requests
 * Validates input and triggers the automation process
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate all form fields
    const validationErrors = validateFormData(body);
    if (validationErrors.length > 0) {
      const errorResponse: QuoteErrorResponse = {
        success: false,
        error: 'Validation failed',
        details: validationErrors.join('; '),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Type assertion after validation
    const formData = body as TransamericaQuoteFormData;
    
    // Get quote using automation
    const result = await getTransamericaQuote(formData);
    
    // Return appropriate status code based on success
    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
    
  } catch (error) {
    console.error('[API Error]', error);
    
    const errorResponse: QuoteErrorResponse = {
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : undefined,
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET handler - returns API information
 */
export async function GET() {
  return NextResponse.json({
    name: 'Transamerica Quote API',
    version: '1.0.0',
    description: 'AI-powered browser automation for life insurance quoting',
    endpoints: {
      POST: {
        description: 'Submit quote request with client information',
        contentType: 'application/json',
        requiredFields: [
          'coverageAmount', 'zipCode', 'state', 'dateOfBirth', 'gender',
          'weightLbs', 'heightFeet', 'heightInches', 'drivingRecord',
          'healthStatus', 'nicotineUse', 'paymentFrequency', 'yearsCovered'
        ],
      },
    },
    status: process.env.OPENAI_API_KEY ? 'ready' : 'demo-mode',
  });
}

