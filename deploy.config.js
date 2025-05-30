
// Deployment configuration for Vastu Shakti Chakra Tool
export default {
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true,
    sourcemap: false
  },
  
  // Server configuration
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false
  },
  
  // Preview configuration
  preview: {
    port: 4173,
    host: '0.0.0.0'
  },
  
  // Base path for deployment
  base: './',
  
  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  
  // Optimization
  esbuild: {
    drop: ['console', 'debugger']
  }
};
