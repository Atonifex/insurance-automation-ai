import { NextRequest, NextResponse } from 'next/server';
import { 
  TransamericaQuoteFormData, 
  QuoteResponse, 
  QuoteErrorResponse,
  US_STATES 
} from '../../types';

/**
 * Transamerica Quote API Route - OpenAI Computer Use Integration
 * 
 * This implements the full OpenAI CUA (Computer-Using Agent) loop:
 * 1. Launch Playwright browser as the execution environment
 * 2. Send task to OpenAI with computer_use_preview tool
 * 3. Receive actions (click, type, scroll, etc.)
 * 4. Execute actions in Playwright
 * 5. Capture screenshot and send back to OpenAI
 * 6. Repeat until task complete
 * 
 * REQUIREMENTS:
 * - OPENAI_API_KEY environment variable
 * - Playwright installed with browsers: npx playwright install
 * - Run locally (not on serverless like Vercel)
 */

// Validation constants
const VALID_NICOTINE_VALUES = ['Never', 'Currently', 'None for 1 Year', 'None for 2 Years', 'None for 3+ Years'];
const VALID_FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];
const VALID_YEARS = [10, 20, 30];
const VALID_GENDERS = ['Male', 'Female'];
const VALID_RECORDS = ['Excellent', 'Good', 'Fair'];

// Browser viewport dimensions - must match what we tell OpenAI
const DISPLAY_WIDTH = 1024;
const DISPLAY_HEIGHT = 768;

// Maximum iterations to prevent infinite loops
const MAX_ITERATIONS = 50;

/**
 * Validates all fields from the incoming request body
 */
function validateFormData(data: unknown): string[] {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return ['Invalid request body'];
  }
  
  const form = data as Partial<TransamericaQuoteFormData>;
  
  if (typeof form.coverageAmount !== 'number' || form.coverageAmount < 25000 || form.coverageAmount > 10000000) {
    errors.push('Coverage amount must be between $25,000 and $10,000,000');
  }
  
  if (typeof form.zipCode !== 'string' || !/^\d{5}$/.test(form.zipCode)) {
    errors.push('ZIP code must be exactly 5 digits');
  }
  
  if (!form.state || !US_STATES.includes(form.state as typeof US_STATES[number])) {
    errors.push('Invalid state selected');
  }
  
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
  
  if (!form.gender || !VALID_GENDERS.includes(form.gender)) {
    errors.push('Invalid gender selected');
  }
  
  if (typeof form.weightLbs !== 'number' || form.weightLbs < 50 || form.weightLbs > 500) {
    errors.push('Weight must be between 50 and 500 lbs');
  }
  
  if (typeof form.heightFeet !== 'number' || form.heightFeet < 3 || form.heightFeet > 7) {
    errors.push('Height (feet) must be between 3 and 7');
  }
  if (typeof form.heightInches !== 'number' || form.heightInches < 0 || form.heightInches > 11) {
    errors.push('Height (inches) must be between 0 and 11');
  }
  
  if (!form.drivingRecord || !VALID_RECORDS.includes(form.drivingRecord)) {
    errors.push('Invalid driving record selected');
  }
  
  if (!form.healthStatus || !VALID_RECORDS.includes(form.healthStatus)) {
    errors.push('Invalid health status selected');
  }
  
  if (!form.nicotineUse || !VALID_NICOTINE_VALUES.includes(form.nicotineUse)) {
    errors.push('Invalid nicotine use selected');
  }
  
  if (!form.paymentFrequency || !VALID_FREQUENCIES.includes(form.paymentFrequency)) {
    errors.push('Invalid payment frequency selected');
  }
  
  if (typeof form.yearsCovered !== 'number' || !VALID_YEARS.includes(form.yearsCovered)) {
    errors.push('Years covered must be 10, 20, or 30');
  }
  
  return errors;
}

/**
 * Type definitions for OpenAI Computer Use API
 */
interface ComputerAction {
  type: 'click' | 'double_click' | 'scroll' | 'keypress' | 'type' | 'wait' | 'screenshot' | 'drag';
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  scrollX?: number;
  scrollY?: number;
  keys?: string[];
  text?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
}

interface SafetyCheck {
  id: string;
  code: string;
  message: string;
}

interface ComputerCall {
  type: 'computer_call';
  id: string;
  call_id: string;
  action: ComputerAction;
  pending_safety_checks: SafetyCheck[];
  status: string;
}

interface ReasoningItem {
  type: 'reasoning';
  id: string;
  summary?: Array<{ type: string; text: string }>;
}

interface TextItem {
  type: 'message';
  id: string;
  content: Array<{ type: string; text?: string }>;
}

type OutputItem = ComputerCall | ReasoningItem | TextItem;

interface CUAResponse {
  id: string;
  output: OutputItem[];
}

/**
 * Execute a computer action in Playwright
 */
async function executeAction(page: import('playwright').Page, action: ComputerAction): Promise<void> {
  console.log(`[CUA] Executing action: ${action.type}`, action);
  
  switch (action.type) {
    case 'click': {
      const { x = 0, y = 0, button = 'left' } = action;
      await page.mouse.click(x, y, { button });
      break;
    }
    
    case 'double_click': {
      const { x = 0, y = 0 } = action;
      await page.mouse.dblclick(x, y);
      break;
    }
    
    case 'scroll': {
      const { x = 0, y = 0, scrollX = 0, scrollY = 0 } = action;
      await page.mouse.move(x, y);
      await page.evaluate(`window.scrollBy(${scrollX}, ${scrollY})`);
      break;
    }
    
    case 'keypress': {
      const { keys = [] } = action;
      for (const key of keys) {
        // Map common key names
        const keyMap: Record<string, string> = {
          'ENTER': 'Enter',
          'RETURN': 'Enter',
          'TAB': 'Tab',
          'SPACE': ' ',
          'BACKSPACE': 'Backspace',
          'DELETE': 'Delete',
          'ESCAPE': 'Escape',
          'ARROWUP': 'ArrowUp',
          'ARROWDOWN': 'ArrowDown',
          'ARROWLEFT': 'ArrowLeft',
          'ARROWRIGHT': 'ArrowRight',
          'CTRL': 'Control',
          'ALT': 'Alt',
          'SHIFT': 'Shift',
          'META': 'Meta',
        };
        const mappedKey = keyMap[key.toUpperCase()] || key;
        await page.keyboard.press(mappedKey);
      }
      break;
    }
    
    case 'type': {
      const { text = '' } = action;
      await page.keyboard.type(text);
      break;
    }
    
    case 'wait': {
      await page.waitForTimeout(2000);
      break;
    }
    
    case 'screenshot': {
      // Screenshot is taken at each turn anyway
      break;
    }
    
    case 'drag': {
      const { startX = 0, startY = 0, endX = 0, endY = 0 } = action;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY);
      await page.mouse.up();
      break;
    }
    
    default:
      console.log(`[CUA] Unknown action type: ${(action as ComputerAction).type}`);
  }
  
  // Wait a bit for the action to take effect
  await page.waitForTimeout(500);
}

/**
 * Capture screenshot from Playwright page
 */
async function captureScreenshot(page: import('playwright').Page): Promise<string> {
  const buffer = await page.screenshot({ type: 'png' });
  return buffer.toString('base64');
}

/**
 * Main Computer Use loop - orchestrates the entire automation
 */
async function runComputerUseLoop(
  formData: TransamericaQuoteFormData,
  apiKey: string
): Promise<QuoteResponse | QuoteErrorResponse> {
  // Dynamic import of Playwright
  const { chromium } = await import('playwright');
  
  console.log('[CUA] Starting browser...');
  
  // Launch browser with safety settings
  const browser = await chromium.launch({
    headless: false, // Set to true for production, false to watch it work
    args: ['--disable-extensions', '--disable-file-system'],
  });
  
  const context = await browser.newContext({
    viewport: { width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to Transamerica quote page
    console.log('[CUA] Navigating to Transamerica...');
    await page.goto('https://www.transamerica.com/lifepolicyexplorer/get-quote', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Capture initial screenshot
    const initialScreenshot = await captureScreenshot(page);
    
    // Format data for the task
    const dob = new Date(formData.dateOfBirth);
    const dobFormatted = `${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getDate().toString().padStart(2, '0')}/${dob.getFullYear()}`;
    const heightFormatted = `${formData.heightFeet}'${formData.heightInches}"`;
    
    // Build task instructions
    const taskInstructions = `
You are automating a life insurance quote on the Transamerica website. The page is already loaded.

FILL OUT THE FORM WITH THIS EXACT INFORMATION:
- Coverage Amount: $${formData.coverageAmount.toLocaleString()}
- Term Length: ${formData.yearsCovered} years
- Payment Frequency: ${formData.paymentFrequency}
- ZIP Code: ${formData.zipCode}
- State: ${formData.state}
- Date of Birth: ${dobFormatted}
- Gender: ${formData.gender}
- Height: ${heightFormatted} (${formData.heightFeet} feet, ${formData.heightInches} inches)
- Weight: ${formData.weightLbs} lbs
- Driving Record: ${formData.drivingRecord}
- Health Status: ${formData.healthStatus}
- Nicotine/Tobacco Use: ${formData.nicotineUse}

INSTRUCTIONS:
1. Look at the current page and identify the form fields
2. Fill in each field with the exact values provided above
3. Click dropdown menus and select the correct options
4. Click "Next", "Continue", or "Get Quote" buttons to proceed through the form
5. Continue until you see the final premium/quote result
6. Once you see the estimated premium amount displayed, respond with ONLY the text: PREMIUM_FOUND: $XX.XX (replacing XX.XX with the actual amount)

IMPORTANT:
- Fill fields one at a time
- Wait for dropdowns to open before selecting
- If a field doesn't match exactly, use the closest option
- The goal is to reach the final quote showing the estimated premium
`.trim();

    console.log('[CUA] Sending initial request to OpenAI...');
    
    // Send initial request to OpenAI
    let response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'computer-use-preview',
        tools: [{
          type: 'computer_use_preview',
          display_width: DISPLAY_WIDTH,
          display_height: DISPLAY_HEIGHT,
          environment: 'browser',
        }],
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: taskInstructions,
            },
            {
              type: 'input_image',
              image_url: `data:image/png;base64,${initialScreenshot}`,
            },
          ],
        }],
        reasoning: {
          summary: 'concise',
        },
        truncation: 'auto',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    let cuaResponse: CUAResponse = await response.json();
    console.log('[CUA] Initial response received');
    
    // Main CUA loop
    let iteration = 0;
    let premiumFound: string | null = null;
    
    while (iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(`[CUA] Iteration ${iteration}/${MAX_ITERATIONS}`);
      
      // Check for text output that might contain the premium
      for (const item of cuaResponse.output) {
        if (item.type === 'message' && 'content' in item) {
          for (const content of item.content) {
            if (content.type === 'output_text' && content.text) {
              console.log('[CUA] Model text:', content.text);
              const premiumMatch = content.text.match(/PREMIUM_FOUND:\s*\$?([\d,]+\.?\d*)/i);
              if (premiumMatch) {
                premiumFound = premiumMatch[1];
                console.log(`[CUA] Premium found: $${premiumFound}`);
              }
            }
          }
        }
      }
      
      if (premiumFound) {
        break;
      }
      
      // Find computer_call in output
      const computerCall = cuaResponse.output.find(
        (item): item is ComputerCall => item.type === 'computer_call'
      );
      
      if (!computerCall) {
        console.log('[CUA] No computer_call found, checking for final output...');
        
        // Try to extract premium from page directly
        const pageContent = await page.content();
        const premiumRegex = /(?:estimated\s+)?premium[:\s]*\$?([\d,]+\.?\d*)/i;
        const match = pageContent.match(premiumRegex);
        if (match) {
          premiumFound = match[1].replace(/,/g, '');
          console.log(`[CUA] Premium extracted from page: $${premiumFound}`);
        }
        break;
      }
      
      // Log reasoning if present
      const reasoning = cuaResponse.output.find(
        (item): item is ReasoningItem => item.type === 'reasoning'
      );
      if (reasoning?.summary) {
        for (const summary of reasoning.summary) {
          if (summary.type === 'summary_text') {
            console.log(`[CUA] Reasoning: ${summary.text}`);
          }
        }
      }
      
      // Handle safety checks - auto-acknowledge for this demo
      const acknowledgedSafetyChecks = computerCall.pending_safety_checks.map(check => ({
        id: check.id,
        code: check.code,
        message: check.message,
      }));
      
      if (acknowledgedSafetyChecks.length > 0) {
        console.log('[CUA] Acknowledging safety checks:', acknowledgedSafetyChecks);
      }
      
      // Execute the action
      await executeAction(page, computerCall.action);
      
      // Wait for any network activity to settle
      await page.waitForTimeout(1000);
      
      // Capture new screenshot
      const screenshot = await captureScreenshot(page);
      
      // Get current URL for context
      const currentUrl = page.url();
      
      // Send screenshot back to OpenAI
      console.log('[CUA] Sending screenshot to OpenAI...');
      
      const nextInput: Record<string, unknown>[] = [{
        type: 'computer_call_output',
        call_id: computerCall.call_id,
        output: {
          type: 'input_image',
          image_url: `data:image/png;base64,${screenshot}`,
        },
        current_url: currentUrl,
      }];
      
      // Add acknowledged safety checks if any
      if (acknowledgedSafetyChecks.length > 0) {
        (nextInput[0] as Record<string, unknown>).acknowledged_safety_checks = acknowledgedSafetyChecks;
      }
      
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'computer-use-preview',
          previous_response_id: cuaResponse.id,
          tools: [{
            type: 'computer_use_preview',
            display_width: DISPLAY_WIDTH,
            display_height: DISPLAY_HEIGHT,
            environment: 'browser',
          }],
          input: nextInput,
          truncation: 'auto',
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }
      
      cuaResponse = await response.json();
    }
    
    await browser.close();
    
    if (premiumFound) {
      const premiumRaw = parseFloat(premiumFound.replace(/,/g, ''));
      return {
        success: true,
        premium: `$${premiumRaw.toFixed(2)}`,
        premiumRaw,
        frequency: formData.paymentFrequency,
        coverageAmount: formData.coverageAmount,
        yearsCovered: formData.yearsCovered,
      };
    }
    
    return {
      success: false,
      error: 'Could not extract premium from the quote process',
      details: `Completed ${iteration} iterations without finding premium`,
    };
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Main quote handler
 */
async function getTransamericaQuote(formData: TransamericaQuoteFormData): Promise<QuoteResponse | QuoteErrorResponse> {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
      details: 'Set OPENAI_API_KEY in your .env.local file',
    };
  }
  
  console.log('[Quote API] Starting Computer Use automation...');
  
  try {
    return await runComputerUseLoop(formData, openaiKey);
  } catch (error) {
    console.error('[Quote API] Error:', error);
    return {
      success: false,
      error: 'Automation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * POST handler for quote requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationErrors = validateFormData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors.join('; '),
      } as QuoteErrorResponse, { status: 400 });
    }
    
    const formData = body as TransamericaQuoteFormData;
    const result = await getTransamericaQuote(formData);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
    
  } catch (error) {
    console.error('[API Error]', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    } as QuoteErrorResponse, { status: 500 });
  }
}

/**
 * GET handler - API information
 */
export async function GET() {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    name: 'Transamerica Quote API',
    version: '2.0.0',
    description: 'OpenAI Computer Use powered browser automation for life insurance quoting',
    status: hasApiKey ? 'ready' : 'missing-api-key',
    requirements: [
      'OPENAI_API_KEY environment variable',
      'Playwright installed: npm install playwright',
      'Playwright browsers: npx playwright install',
      'Run locally (not serverless)',
    ],
    endpoints: {
      POST: {
        description: 'Submit quote request - triggers browser automation',
        contentType: 'application/json',
        requiredFields: [
          'coverageAmount', 'zipCode', 'state', 'dateOfBirth', 'gender',
          'weightLbs', 'heightFeet', 'heightInches', 'drivingRecord',
          'healthStatus', 'nicotineUse', 'paymentFrequency', 'yearsCovered'
        ],
      },
    },
  });
}
