# Understanding Drupal AJAX Form Behavior

## What Triggers AJAX in Drupal Forms?

Drupal uses AJAX extensively for **progressive form enhancement**. Here's what's happening:

### Common AJAX Triggers:

1. **Field Changes (`change` event)**
   - When you select a dropdown option
   - When you type in an input field and it loses focus (`blur`)
   - Drupal may validate or update dependent fields via AJAX

2. **Form Submissions (`submit` event)**
   - When clicking "Next", "Continue", or "Submit" buttons
   - Drupal uses AJAX to submit forms without full page reloads
   - This is what you're seeing: `get-quote?ajax_form=1&_wrapper_format=drupal_ajax`

3. **Button Clicks (`click` event)**
   - Some buttons trigger AJAX to load the next form step
   - Or to validate current step before proceeding

4. **Input Events (`input` event)**
   - Real-time validation as you type
   - Auto-complete suggestions
   - Dynamic field updates

## Why You're Getting 403 Errors

The 403 errors suggest the server is **rejecting** the AJAX requests. Common reasons:

### 1. **Missing CSRF Tokens**
Drupal forms include hidden fields:
- `form_build_id` - Unique form instance ID
- `form_token` - CSRF protection token
- `form_id` - Form identifier

**If these aren't included in AJAX requests → 403**

### 2. **Missing Headers**
AJAX requests need:
- `X-Requested-With: XMLHttpRequest`
- `Referer: https://www.transamerica.com/...`
- Proper `Content-Type`

**If headers are wrong → 403**

### 3. **Bot Detection**
The server might detect:
- Missing or suspicious `User-Agent`
- Missing cookies/session
- Automation indicators
- Rate limiting

**If detected as bot → 403**

### 4. **Timing Issues**
- Form tokens might expire
- Session might timeout
- Race conditions if clicking too fast

## What the Diagnostics Will Show

When you run the automation now, you'll see:

```
[AJAX Trigger] POST get-quote?ajax_form=1...
[AJAX Trigger] Called from: HTMLFormElement.submit (form.js:123)
[DOM Event] click on BUTTON#edit-submit
[CUA] 📤 AJAX Request: POST get-quote?ajax_form=1...
[CUA] ⚠️ AJAX 403 error: POST get-quote?ajax_form=1...
```

This tells you:
- **What action triggered it** (click, change, submit)
- **What element triggered it** (which button/field)
- **What data was sent** (form values, tokens)
- **Why it failed** (missing headers, tokens, etc.)

## The Flow

```
User Action (Click/Type)
    ↓
DOM Event Fires (change/click/submit)
    ↓
Drupal JavaScript Handler
    ↓
Collects Form Data + CSRF Tokens
    ↓
Makes AJAX Request
    ↓
Server Validates (tokens, headers, session)
    ↓
✅ 200 OK → Updates form
❌ 403 Forbidden → Error (what you're seeing)
```

## Next Steps

Once you run it and see the diagnostic output, we can:
1. **Identify the exact trigger** - What action causes the AJAX?
2. **See what's missing** - Are tokens being sent? Headers correct?
3. **Fix the root cause** - Add missing tokens, fix headers, handle timing

Run the automation and check the console output - it will show exactly what's triggering the AJAX and why it's failing!

