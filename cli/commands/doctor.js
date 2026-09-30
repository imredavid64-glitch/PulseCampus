import { Command } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

export const doctorCommand = new Command('doctor')
  .description('Check PulseCampus setup health')
  .option('--fix', 'Attempt to fix issues automatically')
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n🏥 PulseCampus Health Check\n'));

    const results = [];

    // Check repository structure
    results.push(await checkRepoStructure());
    
    // Check configuration files
    results.push(await checkConfigFiles());
    
    // Check environment files
    results.push(await checkEnvFiles());
    
    // Check dependencies
    results.push(await checkDependencies());
    
    // Check build
    results.push(await checkBuild());
    
    // Check database connectivity (if configured)
    results.push(await checkDatabase());

    // Summary
    console.log(chalk.bold('\n📊 Summary'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    results.forEach(r => {
      const icon = r.passed ? chalk.green('✅') : chalk.red('❌');
      console.log(`  ${icon} ${r.name}`);
      if (!r.passed && r.message) {
        console.log(`     ${chalk.yellow(r.message)}`);
      }
    });
    
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  Passed: ${chalk.green(passed)} | Failed: ${chalk.red(failed)}`);
    
    if (failed > 0) {
      console.log(chalk.yellow('\nRun with --fix to attempt automatic repairs'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n🎉 All checks passed!'));
    }
  });

async function checkRepoStructure() {
  const required = [
    'backend/app/main.py',
    'backend/requirements.txt',
    'backend/schema.sql',
    'frontend/package.json',
    'frontend/next.config.js',
    'frontend/tsconfig.json',
    'config/school.example.py',
    'README.md'
  ];

  const missing = [];
  for (const file of required) {
    if (!(await fs.pathExists(path.join(ROOT_DIR, file)))) {
      missing.push(file);
    }
  }

  return {
    name: 'Repository structure',
    passed: missing.length === 0,
    message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
  };
}

async function checkConfigFiles() {
  const files = [
    'config/school.example.py',
    'frontend/src/lib/school-config.ts'
  ];

  const missing = [];
  for (const file of files) {
    if (!(await fs.pathExists(path.join(ROOT_DIR, file)))) {
      missing.push(file);
    }
  }

  // Check for local config
  const hasLocalConfig = await fs.pathExists(path.join(ROOT_DIR, 'frontend', 'src', 'lib', 'school-config.local.ts'));

  return {
    name: 'Configuration files',
    passed: missing.length === 0,
    message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : (hasLocalConfig ? undefined : 'Run create-pulse-campus init to generate local config')
  };
}

async function checkEnvFiles() {
  const backendEnv = path.join(ROOT_DIR, 'backend', '.env');
  const frontendEnv = path.join(ROOT_DIR, 'frontend', '.env.local');

  const backendExists = await fs.pathExists(backendEnv);
  const frontendExists = await fs.pathExists(frontendEnv);

  const missing = [];
  if (!backendExists) missing.push('backend/.env');
  if (!frontendExists) missing.push('frontend/.env.local');

  // Check for required keys in backend .env
  let backendKeysOk = true;
  if (backendExists) {
    const content = await fs.readFile(path.join(ROOT_DIR, 'backend', '.env'), 'utf-8');
    const required = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'DATABASE_URL'];
    for (const key of required) {
      if (!content.includes(`${key}=`) || content.includes(`${key}=your_`)) {
        backendKeysOk = false;
        break;
      }
    }
  }

  return {
    name: 'Environment files',
    passed: backendExists && frontendExists && backendKeysOk,
    message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : (!backendKeysOk ? 'Backend .env has placeholder values' : undefined)
  };
}

async function checkDependencies() {
  const frontendOk = await fs.pathExists(path.join(ROOT_DIR, 'frontend', 'node_modules'));
  const backendOk = await fs.pathExists(path.join(ROOT_DIR, 'backend', 'venv')) || 
                    await fs.pathExists(path.join(ROOT_DIR, 'backend', '.venv'));

  return {
    name: 'Dependencies installed',
    passed: frontendOk && backendOk,
    message: !frontendOk ? 'Run npm install in frontend/' : (!backendOk ? 'Run python -m venv venv && pip install -r requirements.txt in backend/' : undefined)
  };
}

async function checkBuild() {
  const frontendBuild = await fs.pathExists(path.join(ROOT_DIR, 'frontend', '.next'));
  
  return {
    name: 'Build artifacts',
    passed: frontendBuild,
    message: !frontendBuild ? 'Run npm run build in frontend/' : undefined
  };
}

async function checkDatabase() {
  const backendEnv = path.join(ROOT_DIR, 'backend', '.env');
  if (!(await fs.pathExists(backendEnv))) {
    return {
      name: 'Database connectivity',
      passed: false,
      message: 'Backend .env not found - cannot test database'
    };
  }

  const content = await fs.readFile(path.join(ROOT_DIR, 'backend', '.env'), 'utf-8');
  const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
  
  if (!dbUrlMatch) {
    return {
      name: 'Database connectivity',
      passed: false,
      message: 'DATABASE_URL not configured in backend/.env'
    };
  }

  // Test connection (quick ping)
  try {
    await execa('python3', ['-c', `
import asyncpg
import os
from dotenv import load_dotenv
load_dotenv()
url = os.getenv("DATABASE_URL")
if url:
    conn = await asyncpg.connect(url, command_timeout=5)
    await conn.execute("SELECT 1")
    await conn.close()
    print("OK")
`], { cwd: ROOT_DIR, timeout: 10000 });
    
    return {
      name: 'Database connectivity',
      passed: true
    };
  } catch (err) {
    return {
      name: 'Database connectivity',
      passed: false,
      message: 'Cannot connect to Supabase (check DATABASE_URL and network)'
    };
  }
}