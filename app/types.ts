/**
 * Type definitions for Transamerica Life Insurance Quote Form
 * These types define the structure of form data collected from the insurance agent
 */

// Available US states for the dropdown
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
] as const;

export type USState = typeof US_STATES[number];

// Gender options
export type Gender = 'Male' | 'Female';

// Driving record quality options
export type DrivingRecord = 'Excellent' | 'Good' | 'Fair';

// Health status options
export type HealthStatus = 'Excellent' | 'Good' | 'Fair';

// Nicotine usage options matching Transamerica's form
export type NicotineUse = 
  | 'Never' 
  | 'Currently' 
  | 'None for 1 Year' 
  | 'None for 2 Years' 
  | 'None for 3+ Years';

// Payment frequency options
export type PaymentFrequency = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';

// Coverage term length in years
export type YearsCovered = 10 | 20 | 30;

/**
 * Main form data interface representing all fields required for a Transamerica quote
 */
export interface TransamericaQuoteFormData {
  // Coverage details
  coverageAmount: number;        // Coverage amount in USD (e.g., 250000)
  yearsCovered: YearsCovered;    // Term length: 10, 20, or 30 years
  paymentFrequency: PaymentFrequency;
  
  // Location
  zipCode: string;               // 5-digit ZIP code
  state: USState;
  
  // Personal information
  dateOfBirth: string;           // ISO date string (YYYY-MM-DD)
  gender: Gender;
  
  // Physical attributes
  weightLbs: number;             // Weight in pounds
  heightFeet: number;            // Height - feet component
  heightInches: number;          // Height - inches component (0-11)
  
  // Health & lifestyle factors
  drivingRecord: DrivingRecord;
  healthStatus: HealthStatus;
  nicotineUse: NicotineUse;
}

/**
 * API response structure for successful quote retrieval
 */
export interface QuoteResponse {
  success: true;
  premium: string;               // Formatted premium amount (e.g., "$13.18")
  premiumRaw: number;            // Raw numeric premium value
  frequency: PaymentFrequency;   // Payment frequency for context
  coverageAmount: number;        // Coverage amount for confirmation
  yearsCovered: YearsCovered;    // Term length for confirmation
}

/**
 * API response structure for errors
 */
export interface QuoteErrorResponse {
  success: false;
  error: string;                 // Human-readable error message
  details?: string;              // Optional technical details for debugging
}

/**
 * Union type for all possible API responses
 */
export type QuoteAPIResponse = QuoteResponse | QuoteErrorResponse;

/**
 * Form validation errors - maps field names to error messages
 */
export type FormErrors = Partial<Record<keyof TransamericaQuoteFormData | 'general', string>>;

/**
 * Form submission state for UI feedback
 */
export type FormSubmitState = 'idle' | 'submitting' | 'success' | 'error';

