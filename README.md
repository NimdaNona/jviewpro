# JViewPro

A modern, professional JSON viewer and editor with advanced features built with Next.js 15.

## Features

- 🚀 Fast JSON parsing and viewing
- 📁 Support for ZIP file extraction
- ✂️ Freemium model with premium editing features
- 💳 Stripe integration for subscriptions
- 🎨 Modern UI with dark/light mode
- 📱 Responsive design for all devices
- 🔒 Client-side processing for privacy

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.local.example .env.local`
4. Start development server: `npm run dev`

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript check
npm test             # Run tests
npm run test:e2e     # Run E2E tests
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── hooks/              # Custom hooks
├── stores/             # Zustand stores
├── types/              # TypeScript types
├── config/             # Configuration files
└── lib/                # Utility functions
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Payments**: Stripe
- **Deployment**: Vercel

## License

MIT License - see LICENSE file for details.