const { execSync } = require('child_process');

console.log('Installing missing dependencies...');

try {
  console.log('Installing pino-pretty...');
  execSync('npm install pino-pretty --save', { stdio: 'inherit' });
  
  console.log('Installing other potential missing dependencies...');
  execSync('npm install bs58 tweetnacl --save', { stdio: 'inherit' });
  
  console.log('All dependencies installed successfully!');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
}

console.log('All done! You can now run the application again.');
