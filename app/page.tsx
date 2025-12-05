'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import {
  TransamericaQuoteFormData,
  QuoteAPIResponse,
  FormErrors,
  FormSubmitState,
  US_STATES,
  Gender,
  DrivingRecord,
  HealthStatus,
  NicotineUse,
  PaymentFrequency,
  YearsCovered,
} from './types';

/**
 * Initial form state with sensible defaults for quick testing
 */
const initialFormData: TransamericaQuoteFormData = {
  coverageAmount: 250000,
  zipCode: '',
  state: 'SC',
  dateOfBirth: '',
  gender: 'Male',
  weightLbs: 170,
  heightFeet: 5,
  heightInches: 10,
  drivingRecord: 'Good',
  healthStatus: 'Good',
  nicotineUse: 'Never',
  paymentFrequency: 'Monthly',
  yearsCovered: 20,
};

/**
 * Landing page component with Transamerica quote form
 * Collects client data from insurance agents and submits to automation API
 */
export default function Home() {
  // Form data state - stores all 12 required fields
  const [formData, setFormData] = useState<TransamericaQuoteFormData>(initialFormData);
  
  // Form validation errors
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Submission state for loading/success/error UI feedback
  const [submitState, setSubmitState] = useState<FormSubmitState>('idle');
  
  // Stores the API response after successful submission
  const [quoteResult, setQuoteResult] = useState<QuoteAPIResponse | null>(null);

  /**
   * Generic input change handler for form fields
   * Handles text, number, and select inputs
   */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Clear any existing error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Convert numeric inputs to numbers, keep others as strings
    const processedValue = type === 'number' ? Number(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  /**
   * Validates all form fields before submission
   * Returns true if valid, false otherwise (and sets error state)
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Coverage amount validation
    if (!formData.coverageAmount || formData.coverageAmount < 25000) {
      newErrors.coverageAmount = 'Coverage amount must be at least $25,000';
    }
    if (formData.coverageAmount > 10000000) {
      newErrors.coverageAmount = 'Coverage amount cannot exceed $10,000,000';
    }

    // ZIP code validation (5 digits)
    if (!formData.zipCode || !/^\d{5}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid 5-digit ZIP code';
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18 || age > 80) {
        newErrors.dateOfBirth = 'Applicant must be between 18 and 80 years old';
      }
    }

    // Weight validation
    if (!formData.weightLbs || formData.weightLbs < 50 || formData.weightLbs > 500) {
      newErrors.weightLbs = 'Please enter a valid weight (50-500 lbs)';
    }

    // Height validation
    if (formData.heightFeet < 3 || formData.heightFeet > 7) {
      newErrors.heightFeet = 'Please enter a valid height';
    }
    if (formData.heightInches < 0 || formData.heightInches > 11) {
      newErrors.heightInches = 'Inches must be 0-11';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Form submission handler
   * Validates form, sends POST request to API, and handles response
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    if (!validateForm()) {
      return;
    }

    // Reset state for new submission
    setSubmitState('submitting');
    setQuoteResult(null);

    try {
      // POST request to our backend automation API
      const response = await fetch('/api/transamerica-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: QuoteAPIResponse = await response.json();
      
      setQuoteResult(data);
      setSubmitState(data.success ? 'success' : 'error');
    } catch (error) {
      // Network or unexpected errors
      setQuoteResult({
        success: false,
        error: 'Failed to connect to quote service. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
      setSubmitState('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI4MzAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTE4IDE4YzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00em0wLTE4YzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00em0tMTggMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bS0xOCAwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00em0wLTE4YzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00em0xOCAwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-12">
        {/* Header section */}
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            AI-Powered Automation
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Life Insurance Quote
          </h1>
          <p className="max-w-md text-lg text-slate-400">
            Instantly get Transamerica term life quotes using AI browser automation
          </p>
        </header>

        {/* Main form card */}
        <main className="w-full max-w-2xl">
          <form 
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-sm"
          >
            {/* Coverage Details Section */}
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-400">1</span>
                Coverage Details
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Coverage Amount */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Coverage Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      name="coverageAmount"
                      value={formData.coverageAmount}
                      onChange={handleChange}
                      className={`w-full rounded-lg border bg-slate-900/50 py-2.5 pl-7 pr-3 text-white placeholder-slate-500 transition focus:outline-none focus:ring-2 ${
                        errors.coverageAmount 
                          ? 'border-red-500 focus:ring-red-500/50' 
                          : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/50'
                      }`}
                      placeholder="250000"
                    />
                  </div>
                  {errors.coverageAmount && (
                    <p className="mt-1 text-xs text-red-400">{errors.coverageAmount}</p>
                  )}
                </div>

                {/* Years Covered */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Term Length
                  </label>
                  <select
                    name="yearsCovered"
                    value={formData.yearsCovered}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2.5 text-white transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {([10, 20, 30] as YearsCovered[]).map(years => (
                      <option key={years} value={years}>{years} Years</option>
                    ))}
                  </select>
                </div>

                {/* Payment Frequency */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Payment Frequency
                  </label>
                  <select
                    name="paymentFrequency"
                    value={formData.paymentFrequency}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2.5 text-white transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {(['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] as PaymentFrequency[]).map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-400">2</span>
                Location
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {/* ZIP Code */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    maxLength={5}
                    className={`w-full rounded-lg border bg-slate-900/50 px-3 py-2.5 text-white placeholder-slate-500 transition focus:outline-none focus:ring-2 ${
                      errors.zipCode 
                        ? 'border-red-500 focus:ring-red-500/50' 
                        : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/50'
                    }`}
                    placeholder="29201"
                  />
                  {errors.zipCode && (
                    <p className="mt-1 text-xs text-red-400">{errors.zipCode}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    State
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2.5 text-white transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-400">3</span>
                Personal Information
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Date of Birth */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full rounded-lg border bg-slate-900/50 px-3 py-2.5 text-white transition focus:outline-none focus:ring-2 ${
                      errors.dateOfBirth 
                        ? 'border-red-500 focus:ring-red-500/50' 
                        : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/50'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-400">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2.5 text-white transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {(['Male', 'Female'] as Gender[]).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Physical Attributes Section */}
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-400">4</span>
                Physical Attributes
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Weight */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    name="weightLbs"
                    value={formData.weightLbs}
                    onChange={handleChange}
                    className={`w-full rounded-lg border bg-slate-900/50 px-3 py-2.5 text-white placeholder-slate-500 transition focus:outline-none focus:ring-2 ${
                      errors.weightLbs 
                        ? 'border-red-500 focus:ring-red-500/50' 
                        : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/50'
                    }`}
                    placeholder="170"
                  />
                  {errors.weightLbs && (
                    <p className="mt-1 text-xs text-red-400">{errors.weightLbs}</p>
                  )}
                </div>

                {/* Height - Feet */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Height (feet)
                  </label>
                  <input
                    type="number"
                    name="heightFeet"
                    value={formData.heightFeet}
                    onChange={handleChange}
                    min={3}
                    max={7}
                    className={`w-full rounded-lg border bg-slate-900/50 px-3 py-2.5 text-white transition focus:outline-none focus:ring-2 ${
                      errors.heightFeet 
                        ? 'border-red-500 focus:ring-red-500/50' 
                        : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/50'
                    }`}
                  />
                  {errors.heightFeet && (
                    <p className="mt-1 text-xs text-red-400">{errors.heightFeet}</p>
                  )}
                </div>

                {/* Height - Inches */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Height (inches)
                  </label>
                  <input
                    type="number"
                    name="heightInches"
                    value={formData.heightInches}
                    onChange={handleChange}
                    min={0}
                    max={11}
                    className={`w-full rounded-lg border bg-slate-900/50 px-3 py-2.5 text-white transition focus:outline-none focus:ring-2 ${
                      errors.heightInches 
                        ? 'border-red-500 focus:ring-red-500/50' 
                        : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/50'
                    }`}
                  />
                  {errors.heightInches && (
                    <p className="mt-1 text-xs text-red-400">{errors.heightInches}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Health & Lifestyle Section */}
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-400">5</span>
                Health & Lifestyle
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Driving Record */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Driving Record
                  </label>
                  <select
                    name="drivingRecord"
                    value={formData.drivingRecord}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2.5 text-white transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {(['Excellent', 'Good', 'Fair'] as DrivingRecord[]).map(record => (
                      <option key={record} value={record}>{record}</option>
                    ))}
                  </select>
                </div>

                {/* Health Status */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Health Status
                  </label>
                  <select
                    name="healthStatus"
                    value={formData.healthStatus}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2.5 text-white transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {(['Excellent', 'Good', 'Fair'] as HealthStatus[]).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Nicotine Use */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Nicotine Use
                  </label>
                  <select
                    name="nicotineUse"
                    value={formData.nicotineUse}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2.5 text-white transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {(['Never', 'Currently', 'None for 1yr', 'None for 2yrs', 'None for 3+ yrs'] as NicotineUse[]).map(use => (
                      <option key={use} value={use}>{use}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitState === 'submitting'}
              className={`group relative w-full overflow-hidden rounded-xl py-4 text-lg font-semibold transition-all ${
                submitState === 'submitting'
                  ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30'
              }`}
            >
              {submitState === 'submitting' ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI Agent Working...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Get Quote
                  <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Quote Result Display */}
          {quoteResult && (
            <div className={`mt-6 overflow-hidden rounded-2xl border ${
              quoteResult.success 
                ? 'border-emerald-500/30 bg-emerald-500/10' 
                : 'border-red-500/30 bg-red-500/10'
            }`}>
              {quoteResult.success ? (
                <div className="p-8 text-center">
                  <div className="mb-2 text-sm font-medium uppercase tracking-wider text-emerald-400">
                    Estimated Premium
                  </div>
                  <div className="mb-4 text-5xl font-bold text-white">
                    {quoteResult.premium}
                  </div>
                  <div className="text-sm text-slate-400">
                    {quoteResult.frequency} • ${quoteResult.coverageAmount.toLocaleString()} coverage • {quoteResult.yearsCovered} year term
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="mb-2 flex items-center gap-2 text-red-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">Quote Error</span>
                  </div>
                  <p className="text-slate-300">{quoteResult.error}</p>
                  {quoteResult.details && (
                    <p className="mt-2 text-xs text-slate-500">Details: {quoteResult.details}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>Powered by OpenAI Computer Use • Transamerica Life Policy Explorer</p>
          <p className="mt-1">Demo prototype for insurance automation</p>
        </footer>
      </div>
    </div>
  );
}
