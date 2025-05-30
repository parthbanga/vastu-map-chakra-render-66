
# Vastu Shakti Chakra Tool - Deployment Guide

## Overview
This is a professional web-based tool for Vastu practitioners to visualize and analyze building layouts using Shakti Chakra overlay.

## Technologies Used
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Fabric.js
- Shadcn/ui Components

## Local Development

### Prerequisites
- Node.js 18+ or Bun
- Modern web browser

### Setup
1. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

2. Start development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

3. Open http://localhost:5173

## Production Deployment

### Build for Production
```bash
npm run build
# or
bun run build
```

This creates a `dist` folder with optimized production files.

### Server Deployment Options

#### Option 1: Static Hosting (Recommended)
Upload the contents of the `dist` folder to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting
- AWS S3 + CloudFront

#### Option 2: Traditional Web Server
1. Build the project: `npm run build`
2. Copy contents of `dist` folder to your web server's public_html directory
3. Ensure your server supports SPA (Single Page Application) routing
4. Configure server to serve `index.html` for all routes

#### Option 3: Self-Hosted Server
1. Install Node.js on your server
2. Upload the entire project
3. Run `npm install && npm run build`
4. Serve using: `npm run preview`

### Server Configuration

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteRule ^(?!.*\.).*$ /index.html [L]
```

#### Nginx
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Environment Variables
No environment variables required for basic functionality.

## File Structure for Upload
When uploading to public_html:
```
public_html/
├── index.html          (Main entry point)
├── assets/             (JS, CSS, and other assets)
├── lovable-uploads/    (Chakra image and uploads)
└── favicon.ico         (Site icon)
```

## Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Map image upload (JPG, PNG)
- ✅ Interactive polygon selection
- ✅ Shakti Chakra overlay with rotation, scaling, opacity
- ✅ PDF export functionality
- ✅ Professional UI with Shadcn components

## Support
For technical support or customization requests, contact the development team.
