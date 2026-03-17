# KRF Consumer Simulator

AI-powered consumer panel simulation for Kate's Real Food snack bar R&D.

## Setup

1. `npm install`
2. Copy `.env.local` and add your Anthropic API key
3. `npm run dev`

## Vercel Deployment

1. Push to GitHub
2. Import in Vercel
3. Add `ANTHROPIC_API_KEY` to Vercel Environment Variables
4. Deploy

## Architecture

- **100 personas** weighted by channel revenue: 50 Amazon, 30 D2C, 20 Walmart
- **20 archetypes** from e-commerce consumer behavior research
- **Claude Sonnet** evaluates each persona's reaction to the formulation
- **5 batches** of 20 personas each to stay within token limits
- Ratings on 1-7 scale across 5 dimensions
