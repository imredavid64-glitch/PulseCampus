import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

export const deployCommand = new Command('deploy')
  .description('Deploy to Vercel (frontend) and Render (backend)')
  .option('-e, --env <environment>', 'Environment (production|staging)', 'production')
  .option('--frontend-only', 'Deploy only frontend')
  .option('--backend-only', 'Deploy only backend')
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n🚀 PulseCampus Deployment\n'));

    // Check for required tools
    const checks = await Promise.all([
      checkCommand('vercel', 'Vercel CLI'),
      checkCommand('render', 'Render CLI (optional)'),
    ]);

    if (!checks.every(c => c)) {
      console.log(chalk.yellow('\nInstall missing tools:'));
      if (!checks[0]) console.log(chalk.white('  npm i -g vercel'));
      if (!checks[1]) console.log(chalk.white('  npm i -g @render/cli'));
    }

    // Deploy frontend
    if (!options.backendOnly) {
      await deployFrontend(options.env);
    }

    // Deploy backend
    if (!options.frontendOnly) {
      await deployBackend(options.env);
    }

    console.log(chalk.green.bold('\n✅ Deployment Complete!\n'));
  });

async function checkCommand(cmd, name) {
  try {
    await execa(cmd, ['--version'], { stdio: 'ignore' });
    console.log(chalk.green(`✅ ${name} found`));
    return true;
  } catch {
    console.log(chalk.red(`❌ ${name} not found`));
    return false;
  }
}

async function deployFrontend(env) {
  const spinner = ora(`Deploying frontend to Vercel (${env})...`).start();
  
  try {
    const frontendDir = path.join(ROOT_DIR, 'frontend');
    
    // Build first
    await execa('npm', ['run', 'build'], { cwd: frontendDir, stdio: 'pipe' });
    
    // Deploy
    const vercelArgs = ['deploy', '--prod', '--yes'];
    if (env === 'staging') {
      vercelArgs.splice(1, 1); // Remove --prod for preview
    }
    
    await execa('vercel', vercelArgs, { cwd: frontendDir, stdio: 'inherit' });
    
    spinner.succeed('Frontend deployed to Vercel');
  } catch (err) {
    spinner.fail('Frontend deployment failed');
    console.error(chalk.red(err.message));
  }
}

async function deployBackend(env) {
  const spinner = ora(`Deploying backend to Render (${env})...`).start();
  
  console.log(chalk.yellow('\nBackend deployment to Render:'));
  console.log(chalk.gray('Option 1: Connect GitHub repo to Render dashboard'));
  console.log(chalk.gray('Option 2: Use render CLI (requires render.yaml)'));
  console.log(chalk.gray('Option 3: Use Docker: docker build -t pulse-backend ./backend && docker push ...'));
  
  spinner.stop();
  
  const { method } = await inquirer.prompt([{
    type: 'list',
    name: 'method',
    message: 'How would you like to deploy the backend?',
    choices: [
      { name: 'GitHub + Render Dashboard (recommended)', value: 'github' },
      { name: 'Docker + Container Registry', value: 'docker' },
      { name: 'Skip backend deployment', value: 'skip' }
    ]
  }]);

  if (method === 'github') {
    console.log(chalk.cyan('\n📋 Render Dashboard Setup:'));
    console.log('1. Go to https://dashboard.render.com');
    console.log('2. New > Web Service > Connect GitHub repo');
    console.log('3. Root Directory: backend');
    console.log('4. Build Command: pip install -r requirements.txt');
    console.log('5. Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT');
    console.log('6. Add Environment Variables:');
    console.log('   - GEMINI_API_KEY');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_KEY');
    console.log('   - DATABASE_URL');
    console.log('   - FRONTEND_URL (your Vercel URL)');
    console.log('   - VAPID_PRIVATE_KEY');
    console.log('   - VAPID_PUBLIC_KEY');
    console.log('   - VAPID_SUBJECT');
    console.log('   - SENTRY_DSN (optional)');
  } else if (method === 'docker') {
    await deployBackendDocker();
  }
}

async function deployBackendDocker() {
  const spinner = ora('Building Docker image...').start();
  
  try {
    await execa('docker', ['build', '-t', 'pulse-campus-backend', './backend'], {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    spinner.succeed('Docker image built');
    
    console.log(chalk.cyan('\nNext steps:'));
    console.log('1. Tag: docker tag pulse-campus-backend <registry>/pulse-campus-backend');
    console.log('2. Push: docker push <registry>/pulse-campus-backend');
    console.log('3. Deploy to your container platform (Render, Fly.io, Railway, etc.)');
  } catch (err) {
    spinner.fail('Docker build failed');
  }
}