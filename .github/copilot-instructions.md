# Creative Studio Portfolio Website

A modern, responsive portfolio website for creative businesses built with React, Vite, and Tailwind CSS.

## Project Overview

This is a complete portfolio website solution for web design, photography, videography, and branding businesses. It includes:

- Modern React SPA with Vite
- Portfolio gallery with filtering
- Client testimonials section
- Comprehensive pricing page
- Contact form with validation
- Secure client login and project dashboard
- Responsive design with Tailwind CSS
- Ready for Netlify deployment

## Getting Started

### Prerequisites
- Node.js v16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

### Deployment to Netlify

#### Using Git
1. Push code to GitHub/GitLab
2. Connect repository to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

#### Using Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Via Drag & Drop
1. Run `npm run build`
2. Drag `dist` folder to Netlify

## Project Structure

```
src/
├── components/      - Reusable components (Navigation, Footer, Testimonials)
├── pages/          - Page components (Home, Portfolio, Services, Pricing, Contact, Login, ClientDashboard)
├── App.tsx         - Main app with routing
├── index.css       - Global Tailwind styles
└── main.tsx        - Entry point
```

## Customization Guide

### Update Company Details
- Edit company name in `Navigation.tsx` and `Footer.tsx`
- Update contact info in `Footer.tsx` and `Contact.tsx`
- Change colors in `tailwind.config.ts`

### Add Portfolio Items
Edit `src/pages/Portfolio.tsx` portfolio array with your projects

### Update Services
Modify services array in `src/pages/Services.tsx`

### Configure Pricing
Update pricing tiers in `src/pages/Pricing.tsx`

### Connect Contact Form
Currently frontend-only. Connect to:
- Formspree
- Netlify Forms
- SendGrid
- AWS Lambda

### Client Authentication
Update login logic in `src/pages/Login.tsx` to connect to your backend

## Available Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run lint` - Run ESLint

## Features

✅ Modern React 18 with TypeScript
✅ Vite for fast development
✅ Tailwind CSS for styling
✅ React Router for navigation
✅ React Icons for UI
✅ Responsive design
✅ Portfolio filtering
✅ Contact form
✅ Client login
✅ Project tracking dashboard
✅ SEO friendly
✅ Performance optimized

## Tech Stack

- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- React Router v6
- React Icons
- ESLint

## Deployment

The site is configured for Netlify with:
- `netlify.toml` with build settings
- SPA redirect rules configured
- Environment ready for production

## Support

See README.md for full documentation.
