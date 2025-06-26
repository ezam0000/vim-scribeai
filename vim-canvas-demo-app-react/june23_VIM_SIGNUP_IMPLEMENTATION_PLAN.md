# VIM-Specific Signup Page Implementation Plan

## Overview
This document outlines the implementation plan for creating a VIM-specific signup experience at `https://scribeai.live/signup/vim` that leverages the existing ScribeAI infrastructure while providing tailored messaging and workflow for VIM platform users.

## Current Infrastructure Analysis

### Existing Codebase Structure (`/scribeai_api`)
```
scribeai_api/
├── server.js (152KB, 4319 lines) - Main Express server
├── public/ - Frontend assets including signup.html
├── routes/ - Modular route handlers
├── utils/ - Shared utilities
├── package.json - Dependencies and scripts
├── .env - Environment configuration
└── deploy.sh - Deployment scripts
```

### Current Signup Flow References
- **Frontend**: `public/signup.html` + `public/onboarding.css` + `public/payment.js`
- **Backend**: `server.js` contains signup endpoints and Stripe integration
- **Authentication**: Supabase integration in `server.js`
- **Payment Processing**: Stripe implementation in `payment.js`

## Implementation Plan

### Phase 1: Backend Infrastructure (Day 1)

#### 1.1 Server Route Setup
**File**: `server.js` (around line 1076 where current `/signup` route exists)

```javascript
// Add VIM-specific signup route
app.get('/signup/vim', (req, res) => {
  // Preserve existing query parameters (source=vim, return_to, etc.)
  const queryParams = req.query;
  
  // Serve VIM-specific signup page with context
  res.sendFile(path.join(__dirname, 'public', 'vim-signup.html'), {
    headers: {
      'X-VIM-Integration': 'true',
      'X-Source': 'vim'
    }
  });
});
```

**Location in codebase**: Add after existing signup route at line ~1076 in `server.js`

#### 1.2 Environment Configuration
**File**: `.env` (add VIM-specific variables)

```bash
# VIM Integration Settings
VIM_INTEGRATION_ENABLED=true
VIM_SIGNUP_REDIRECT_URL=your-vim-canvas-app-url
VIM_ANALYTICS_TRACKING_ID=vim-specific-id
```

### Phase 2: Frontend Development (Day 2)

#### 2.1 Create VIM-Specific HTML Template
**New File**: `public/vim-signup.html`

**Based on**: `public/signup.html` structure
**References**: Existing `public/onboarding.css` and `public/payment.js`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScribeAI for VIM Platform - Clinical Documentation AI</title>
    <link rel="stylesheet" href="onboarding.css">
    <link rel="stylesheet" href="vim-signup-overrides.css">
</head>
<body class="vim-platform">
    <!-- VIM-specific content structure -->
</body>
</html>
```

#### 2.2 VIM-Specific Styling
**New File**: `public/vim-signup-overrides.css`

**Dependencies**: Inherits from `public/onboarding.css` (referenced in attached files)

```css
/* VIM Platform Branding Overrides */
.vim-platform {
  --primary-color: #2563eb; /* VIM blue theme */
  --secondary-color: #1e40af;
}

.vim-hero-section {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}

.vim-integration-badge {
  /* VIM partnership/integration styling */
}
```

#### 2.3 JavaScript Enhancements
**Modify**: `public/payment.js` (625 lines - referenced in attached files)

**Changes needed**:
- Add VIM context detection
- Modify analytics tracking
- Customize post-payment redirects
- Add VIM-specific error handling

```javascript
// Add VIM context detection
const isVimSignup = window.location.pathname.includes('/vim') || 
                   new URLSearchParams(window.location.search).get('source') === 'vim';

if (isVimSignup) {
  // VIM-specific tracking and behavior
  // Modify redirect URLs for VIM context
  // Add VIM-specific success messaging
}
```

### Phase 3: Content Customization (Day 2 continued)

#### 3.1 VIM-Specific Messaging Strategy

**Hero Section**:
```
"ScribeAI for VIM Platform"
"AI-Powered Clinical Documentation Integrated with Your VIM Workflow"
"Save 2+ hours daily with intelligent note generation directly in your VIM EHR"
```

**Value Propositions**:
- Native VIM integration - no workflow disruption
- Real-time transcription in VIM encounters
- Automated SOAP notes, progress notes, and clinical documentation
- HIPAA-compliant with VIM security standards

#### 3.2 Testimonial Integration
**Reference**: Current testimonial in signup (Dr. Jacob Joseph)
**Enhancement**: Add VIM-specific healthcare provider testimonials

#### 3.3 Feature Highlights
- VIM Canvas app integration
- Seamless EHR workflow
- Multi-specialty note templates
- Voice recognition and transcription

### Phase 4: Backend Integration Enhancements (Day 3)

#### 4.1 Analytics and Tracking
**File**: `server.js` - Add VIM-specific analytics endpoints

```javascript
// VIM signup conversion tracking
app.post('/api/analytics/vim-signup', authenticateToken, async (req, res) => {
  // Track VIM-specific signup conversions
  // Integration with existing analytics infrastructure
});
```

#### 4.2 Post-Signup Flow Modifications
**File**: `public/payment.js` (line ~280 where redirect logic exists)

```javascript
// Modify success redirect for VIM users
if (isVimSignup && returnUrl) {
  // Redirect back to VIM canvas app with success parameters
  window.location.href = `${returnUrl}?signup_complete=true&source=vim`;
} else {
  // Standard redirect flow
  window.location.href = '/getstarted.html?from_payment=true';
}
```

#### 4.3 Subscription Context
**File**: `server.js` - Modify subscription creation logic

```javascript
// Add VIM context to subscription metadata
const subscriptionMetadata = {
  source: 'vim',
  integration: 'vim-canvas',
  referrer: req.get('Referer'),
  // Existing metadata...
};
```

### Phase 5: Testing and Deployment (Day 4)

#### 5.1 Testing Checklist

**Integration Testing**:
- [ ] VIM canvas popup flow (`SignupModal.tsx` in vim-canvas-demo-app-react)
- [ ] Payment processing with VIM context
- [ ] Post-signup redirect to VIM app
- [ ] Mobile responsiveness in VIM iframe
- [ ] Cross-browser compatibility

**Backend Testing**:
- [ ] Route handling (`/signup/vim`)
- [ ] Analytics tracking
- [ ] Subscription creation with VIM metadata
- [ ] Error handling and logging

#### 5.2 Deployment Process
**Reference**: `deploy.sh` (274 lines in scribeai_api)

**Steps**:
1. Deploy to staging environment
2. Test VIM integration end-to-end
3. Monitor analytics and conversion tracking
4. Deploy to production
5. Update VIM canvas app configuration

### Phase 6: VIM Canvas App Integration

#### 6.1 Update Signup Modal URL
**File**: `vim-canvas-demo-app-react/src/components/SignupModal.tsx`

```typescript
// Change signup URL to VIM-specific endpoint
const signupUrlWithParams = `${SIGNUP_URL}/vim?source=vim&return_to=${encodeURIComponent(
  window.location.origin
)}`;
```

#### 6.2 Success Handling
**File**: `vim-canvas-demo-app-react/src/components/SignupModal.tsx`

```typescript
// Enhanced success detection for VIM-specific parameters
const checkForSignupSuccess = () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('signup_complete') === 'true' && urlParams.get('source') === 'vim') {
    // Handle VIM-specific signup success
    onSignupSuccess();
  }
};
```

## Technical Considerations

### 1. URL Structure and Routing
```
Current: https://scribeai.live/signup
New: https://scribeai.live/signup/vim
Parameters: ?source=vim&return_to=vim-app-url&launch_id=xyz
```

### 2. State Management
- Preserve VIM context throughout signup flow
- Maintain launch parameters and return URLs
- Handle VIM-specific error states

### 3. Security Considerations
- Validate VIM return URLs
- Secure parameter handling
- Maintain existing authentication security
- HIPAA compliance preservation

### 4. Performance Optimization
- Leverage existing CSS/JS assets
- Minimize additional HTTP requests
- Optimize for mobile/iframe rendering
- CDN utilization for VIM-specific assets

## Success Metrics

### Conversion Tracking
- VIM signup conversion rate vs. standard signup
- Time to complete signup (VIM vs. standard)
- Payment success rate by source
- Post-signup activation rates

### User Experience Metrics
- Bounce rate on VIM signup page
- Form completion rates by step
- Mobile vs. desktop performance
- Error rate analysis

## Rollback Plan

### Emergency Rollback
1. Disable VIM route in `server.js`
2. Revert `SignupModal.tsx` to standard URL
3. Monitor existing signup flow stability
4. Investigate and fix issues

### Gradual Rollback
1. A/B test between VIM and standard signup
2. Monitor conversion rates
3. Adjust messaging and UX based on data
4. Full rollout based on performance

## Future Enhancements

### Phase 2 Features
- VIM-specific onboarding flow customization
- Integration with VIM user management
- Advanced analytics dashboard
- Multi-language support for VIM regions

### Integration Opportunities
- VIM Marketplace listing optimization
- Partnership co-marketing materials
- VIM developer program participation
- Enhanced VIM SDK utilization

---

## File References Summary

### Primary Files to Modify:
- `scribeai_api/server.js` - Add VIM route (line ~1076)
- `scribeai_api/public/payment.js` - VIM context handling (line ~280)
- `scribeai_api/.env` - VIM configuration variables

### New Files to Create:
- `scribeai_api/public/vim-signup.html`
- `scribeai_api/public/vim-signup-overrides.css`

### VIM Canvas App Files to Update:
- `vim-canvas-demo-app-react/src/components/SignupModal.tsx`
- `vim-canvas-demo-app-react/src/config/env.ts` (if URL changes needed)

This plan leverages the existing robust infrastructure while providing a tailored VIM experience with minimal risk and maximum reusability. 