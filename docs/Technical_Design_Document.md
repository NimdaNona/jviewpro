# Technical Design Document (TDD) for JView Pro

## 1. Document Overview
### 1.1 Purpose
This Technical Design Document (TDD) provides a detailed blueprint for implementing JView Pro, a lightweight web-based micro SaaS JSON viewer tool, based on the Product Requirements Document (PRD). It outlines the system architecture, technology stack, components, data flows, integrations, security measures, deployment strategy, and testing approach. The design prioritizes simplicity for a solo developer, client-side heavy processing to minimize infrastructure costs, and Vercel compatibility for seamless hosting. This ensures high odds of success by leveraging proven libraries and integrations, enabling a 6-8 week build timeline, and focusing on scalability for initial user growth (up to 1k users/day).

The design draws from market-validated tools (e.g., react-json-view for viewing, JSZip for file handling) and best practices from Vercel and Stripe documentation/guides as of 2025.

### 1.2 Version History
- Version 1.0: Initial draft (August 25, 2025)
- Author: Grok (AI-assisted generation based on PRD and research)
- Stakeholders: Solo developer

### 1.3 Assumptions and Constraints
- **Assumptions**: Client-side processing suffices for file sizes up to 10MB; users have modern browsers; no persistent data storage needed.
- **Constraints**: Solo dev; no external backend (use Vercel serverless functions minimally); budget for Vercel/Stripe (free tiers initially); compliance with Stripe PCI for payments.
- **Dependencies**: Internet access for Stripe; browser support for File API and Web Workers (for large files).

## 2. System Architecture
### 2.1 High-Level Architecture
JView Pro is a single-page application (SPA) with client-side rendering for core functionality, augmented by serverless API routes for secure operations (e.g., Stripe session creation). The architecture is:
- **Frontend**: Next.js app handling UI, file uploads, parsing, and viewing.
- **Backend**: Minimal Vercel serverless functions (API routes) for Stripe integrations to protect API keys.
- **No Database**: All state managed via localStorage/sessionStorage; no user data stored server-side.
- **Deployment**: Vercel for hosting, auto-scaling, and CDN.

This hybrid approach (mostly client-side) ensures low latency and costs, with serverless for sensitive ops.

### 2.2 Data Flow Diagram
- **User Upload Flow**:
  1. User uploads file (zip/JSON) via browser File API.
  2. Client-side: JSZip extracts (if zip), JSON.parse validates, react-json-view renders partial view.
  3. If premium needed: Client requests Stripe session via API route.
  4. Serverless API: Creates Stripe Checkout session, returns session ID.
  5. Client redirects to Stripe Checkout; on success, unlocks full view (local flag).
- **Editing Flow (Premium)**: Inline edits via react-json-view; export as blob download.
- **Analytics Flow**: Client-side Google Analytics tracks events (uploads, payments).

### 2.3 Component Diagram
- **Core Components**:
  - Landing Page: Upload button, marketing copy.
  - Viewer Component: react-json-view wrapper with blur/gating.
  - Payment Modal: Stripe Checkout integration.
- **Serverless Endpoints**:
  - /api/create-checkout-session: POST to generate Stripe session.

## 3. Technology Stack
### 3.1 Frontend
- **Framework**: Next.js (v14+ as of 2025) for React-based SPA, static/dynamic rendering, and Vercel optimization. Supports App Router for modern routing.
- **UI Libraries**: 
  - react-json-view (from uiwjs): For interactive JSON viewing/editing with features like collapsible trees, syntax highlighting, and inline editing.
  - Tailwind CSS or Shadcn/UI: For modern, responsive design (dark/light mode, drag-drop).
- **File Handling**: JSZip for client-side zip extraction/unzipping.
- **State Management**: React hooks (useState, useEffect); no Redux for simplicity.
- **Other**: FileSaver.js for exports; react-hot-toast for notifications.

### 3.2 Backend/Serverless
- **Runtime**: Node.js via Vercel functions.
- **Payments**: Stripe SDK (Node) for session creation; @stripe/stripe-js for client-side.

### 3.3 Tools and Infra
- **Hosting**: Vercel (auto-deploys from Git, CDN, serverless).
- **Analytics**: Google Analytics (client-side script).
- **Environment**: TypeScript for type safety.
- **Build Tools**: npm/yarn; ESLint/Prettier for code quality.

## 4. Detailed Design
### 4.1 Data Models
- **JSON Data**: Raw object from JSON.parse; no schema enforcement (handle via try-catch).
- **Session State**: LocalStorage flags (e.g., { unlocked: true, expiry: timestamp } for subscriptions).
- **Stripe Payload**: { amount: 500, mode: 'payment' or 'subscription', success_url, cancel_url }.

### 4.2 Key Components
- **UploadHandler Component**:
  - Handles File API, JSZip.loadAsync(file).then(zip => zip.forEach(...)).
  - Validates: Check for .json or .zip; parse and store in state.
- **JsonViewer Component**:
  - Uses <ReactJson src={data} theme="rjv-default" enableClipboard={false} /> from react-json-view.
  - Gating: Custom wrapper to blur/render partial (e.g., slice data to first 10 keys).
  - Editing: Set collapsed={false}, onEdit={handleEdit} for premium.
- **PaymentButton**:
  - On click: Fetch /api/create-checkout-session, then stripe.redirectToCheckout(sessionId).
- **API Route: pages/api/create-checkout-session.ts**:
  ```typescript
  import Stripe from 'stripe';
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  export default async function handler(req, res) {
    if (req.method === 'POST') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: 'price_123', quantity: 1 }],
        mode: 'payment', // or 'subscription'
        success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: req.headers.origin,
      });
      res.status(200).json({ id: session.id });
    }
  }
  ```
  - Handle webhooks if subscriptions (separate /api/webhook endpoint with Stripe CLI for local testing).

### 4.3 Integrations
- **Stripe**: Client-side loadStripe; server-side session creation to avoid exposing keys. Use Checkout for one-time/subscriptions. Webhooks for fulfillment (e.g., update via email if needed, but minimal for MVP).
- **Google Analytics**: Script tag in _document.tsx; event tracking for 'upload', 'payment_initiate'.
- **Error Handling**: Global try-catch; user-friendly toasts.

## 5. Security Design
- **Client-Side**: No sensitive data stored; use HTTPS. Sanitize inputs (though minimal).
- **Payments**: Stripe handles PCI; never store card info. Use CSRF tokens for API calls if needed.
- **File Security**: Client-only processing; no upload to server.
- **Best Practices**: Environment variables for keys (Vercel dashboard); Deployment Protection on Vercel.
- **Vulnerabilities**: Mitigate XSS via React escaping; limit file sizes to prevent DoS.

## 6. Performance and Scalability
- **Performance**: Client-side parsing (use Web Workers for large files >5MB); static rendering for landing page via Next.js SSG.
- **Scalability**: Vercel auto-scales functions; CDN for assets. Initial limits: 10MB files, 1k reqs/day (free tier).
- **Optimizations**: Lazy-load libraries; code-splitting in Next.js.

## 7. Deployment and Operations
- **Deployment Pipeline**: Git push to Vercel; auto-build/deploy. Use branches for previews.
- **Environment Variables**: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET in Vercel dashboard (production/preview scopes).
- **Monitoring**: Vercel Analytics for traffic; Stripe Dashboard for payments.
- **Domain**: jviewpro.com via Vercel DNS.
- **CI/CD**: Built-in Vercel; add GitHub Actions if needed for tests.

## 8. Testing Strategy
- **Unit Tests**: Jest for components (e.g., upload parsing); test react-json-view integration.
- **Integration Tests**: Cypress for end-to-end (upload → view → pay).
- **Manual**: Browser testing (Chrome/FF); file size edge cases.
- **Security**: Stripe test mode; scan with npm audit.
- **Coverage Goal**: 80% for core paths.

## 9. Risks and Mitigations
- **Risk: Library Deprecations**: Use stable versions (e.g., JSZip v3+); monitor updates.
- **Risk: Vercel Limits**: Start free; upgrade if traffic exceeds (e.g., $20/mo Pro).
- **Risk: Payment Failures**: Fallback UI; test webhooks locally with Stripe CLI.
- **Risk: Large Files**: Implement size checks; progressive loading.

## 10. Appendices
### 10.1 Code Snippets
- JSZip Example:
  ```javascript
  import JSZip from 'jszip';
  const handleZip = async (file) => {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    const jsonFile = await content.file('data.json').async('string');
    return JSON.parse(jsonFile);
  };
  ```

### 10.2 References
- Vercel Docs: Deployment best practices.
- Stripe Guides: Next.js integrations.
- Libraries: react-json-view docs; JSZip examples.