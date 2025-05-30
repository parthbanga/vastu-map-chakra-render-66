
#!/usr/bin/env node

/**
 * Build script for server deployment
 * Optimizes the project for production hosting
 */

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

console.log('🚀 Building Vastu Chakra Tool for server deployment...\n');

try {
  // Clean and build
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔨 Building production bundle...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Ensure critical files are in place
  const distDir = 'dist';
  const uploadsDir = path.join(distDir, 'lovable-uploads');
  
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }
  
  // Copy chakra image if exists
  const chakraSource = 'public/lovable-uploads/e824cac3-4bde-4c8d-831a-eb96d1098e85.png';
  const chakraTarget = path.join(uploadsDir, 'e824cac3-4bde-4c8d-831a-eb96d1098e85.png');
  
  if (existsSync(chakraSource)) {
    copyFileSync(chakraSource, chakraTarget);
    console.log('🖼️  Copied Shakti Chakra image');
  }
  
  console.log('\n✅ Build complete!');
  console.log('📂 Upload the contents of the "dist" folder to your server\'s public_html directory');
  console.log('🌐 Your Vastu Chakra Tool is ready for deployment!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
