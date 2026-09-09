const { execSync } = require('child_process');
const path = require('path');

try {
  const result = execSync('npx vitest run packages/api/src/modules/tasks/tasks.test.ts --reporter=verbose', {
    cwd: process.cwd(),
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(result);
} catch (error) {
  console.log(error.stdout || error.message);
}
