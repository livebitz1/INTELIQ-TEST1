const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing missing dependencies...');

// Install pino-pretty
try {
  console.log('Installing pino-pretty...');
  execSync('npm install pino-pretty --save', { stdio: 'inherit' });
  console.log('pino-pretty installed successfully');
} catch (error) {
  console.error('Failed to install pino-pretty:', error.message);
}

console.log('All done! You can now run the application.');
