import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

export const initCommand = new Command('init')
  .description('Interactive setup wizard for your school')
  .option('-s, --school <name>', 'School name')
  .option('-d, --domain <domain>', 'School domain (e.g., myuni.edu)')
  .option('--lat <lat>', 'Campus latitude')
  .option('--lng <lng>', 'Campus longitude')
  .option('--primary-color <color>', 'Primary brand color (hex)')
  .option('--secondary-color <color>', 'Secondary brand color (hex)')
  .option('--logo <emoji>', 'Logo emoji')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n🎓 PulseCampus School Setup Wizard\n'));

    // Check if we're in a PulseCampus repo
    const isPulseRepo = await fs.pathExists(path.join(ROOT_DIR, 'backend', 'app', 'main.py'));
    if (!isPulseRepo) {
      console.log(chalk.yellow('⚠️  Not in a PulseCampus repository.'));
      const { clone } = await inquirer.prompt([{
        type: 'confirm',
        name: 'clone',
        message: 'Clone PulseCampus from GitHub?',
        default: true
      }]);
      
      if (clone) {
        const spinner = ora('Cloning PulseCampus...').start();
        try {
          await execa('git', ['clone', 'https://github.com/your-org/PulseCampus.git', '.'], {
            cwd: ROOT_DIR
          });
          spinner.succeed('Repository cloned');
        } catch (err) {
          spinner.fail('Failed to clone');
          console.error(chalk.red('Error:'), err.message);
          process.exit(1);
        }
      } else {
        process.exit(1);
      }
    }

    // Gather school configuration
    const config = await gatherSchoolConfig(options);

    // Confirm configuration
    if (!options.yes) {
      console.log(chalk.bold('\n📋 Configuration Summary:'));
      console.log(chalk.gray('─'.repeat(40)));
      Object.entries(config).forEach(([key, value]) => {
        console.log(`  ${chalk.cyan(key)}: ${chalk.white(value)}`);
      });
      console.log(chalk.gray('─'.repeat(40)));

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with this configuration?',
        default: true
      }]);

      if (!confirm) {
        console.log(chalk.yellow('Setup cancelled.'));
        process.exit(0);
      }
    }

    // Write school config
    const spinner = ora('Writing school configuration...').start();
    await writeSchoolConfig(config);
    spinner.succeed('School configuration written');

    // Install dependencies
    await installDependencies();

    // Setup database (Supabase)
    await setupDatabase(config);

    // Generate environment files
    await generateEnvFiles(config);

    // Success message
    console.log(chalk.green.bold('\n✅ Setup Complete!\n'));
    console.log('Next steps:');
    console.log(chalk.cyan('  1.') + ' Add your API keys to backend/.env');
    console.log(chalk.cyan('  2.') + ' Run ' + chalk.white('npm run dev') + ' in frontend/');
    console.log(chalk.cyan('  3.') + ' Run ' + chalk.white('uvicorn app.main:app --reload') + ' in backend/');
    console.log(chalk.cyan('  4.') + ' Or deploy with ' + chalk.white('create-pulse-campus deploy') + '\n');
  });

async function gatherSchoolConfig(options) {
  const questions = [];

  if (!options.school) {
    questions.push({
      type: 'input',
      name: 'school',
      message: 'School name:',
      default: 'My University Pulse',
      validate: input => input.length > 0 || 'School name is required'
    });
  }

  if (!options.domain) {
    questions.push({
      type: 'input',
      name: 'domain',
      message: 'School domain (e.g., myuni.edu):',
      default: 'myuni.edu',
      validate: input => input.includes('.') || 'Please enter a valid domain'
    });
  }

  if (!options.lat || !options.lng) {
    questions.push({
      type: 'input',
      name: 'lat',
      message: 'Campus latitude (find on Google Maps):',
      default: '37.7245',
      validate: input => !isNaN(parseFloat(input)) || 'Please enter a valid number'
    });
    questions.push({
      type: 'input',
      name: 'lng',
      message: 'Campus longitude:',
      default: '-122.4773',
      validate: input => !isNaN(parseFloat(input)) || 'Please enter a valid number'
    });
  }

  if (!options.primaryColor) {
    questions.push({
      type: 'input',
      name: 'primaryColor',
      message: 'Primary brand color (hex):',
      default: '#1e40af',
      validate: input => /^#[0-9A-Fa-f]{6}$/.test(input) || 'Please enter a valid hex color (e.g., #1e40af)'
    });
  }

  if (!options.secondaryColor) {
    questions.push({
      type: 'input',
      name: 'secondaryColor',
      message: 'Secondary brand color (hex):',
      default: '#16a34a',
      validate: input => /^#[0-9A-Fa-f]{6}$/.test(input) || 'Please enter a valid hex color (e.g., #16a34a)'
    });
  }

  if (!options.logo) {
    questions.push({
      type: 'input',
      name: 'logo',
      message: 'Logo emoji:',
      default: '🏫'
    });
  }

  // Always ask for buildings and courses
  questions.push(
    {
      type: 'editor',
      name: 'buildings',
      message: 'Campus buildings (one per line):',
      default: `Library
Student Union
Engineering Building
Science Hall
Business School
Arts Center
Dormitory A
Dormitory B
Recreation Center
Health Center
Parking Structure
Campus Quad`
    },
    {
      type: 'editor',
      name: 'courses',
      message: 'Course codes (one per line):',
      default: `CS 101
CS 201
CS 301
MATH 101
MATH 201
PHYS 101
CHEM 101
BIO 101
ECON 101
PSYC 101
STAT 101
ENG 101`
    }
  );

  const answers = await inquirer.prompt(questions);
  
  return {
    school: options.school || answers.school,
    domain: options.domain || answers.domain,
    lat: parseFloat(options.lat || answers.lat),
    lng: parseFloat(options.lng || answers.lng),
    primaryColor: options.primaryColor || answers.primaryColor,
    secondaryColor: options.secondaryColor || answers.secondaryColor,
    logo: options.logo || answers.logo,
    buildings: (options.buildings || answers.buildings).split('\n').map(b => b.trim()).filter(b => b),
    courses: (options.courses || answers.courses).split('\n').map(c => c.trim()).filter(c => c),
  };
}

async function writeSchoolConfig(config) {
  const backendConfig = `
from app.school_config import SchoolConfig

SCHOOL_CONFIG = SchoolConfig(
    name="${config.school}",
    short_name="${config.school.replace(/\s+/g, '').substring(0, 20)}",
    domain="${config.domain}",
    default_lat=${config.lat},
    default_lng=${config.lng},
    default_zoom=16,
    buildings=${JSON.stringify(config.buildings, null, 4)},
    courses=${JSON.stringify(config.courses, null, 4)},
    primary_color="${config.primaryColor}",
    secondary_color="${config.secondaryColor}",
    logo_emoji="${config.logo}",
)
`;
  
  await fs.writeFile(path.join(ROOT_DIR, 'config', 'school.py'), backendConfig.trim());

  // Also write frontend config
  const frontendConfig = {
    name: config.school,
    shortName: config.school.replace(/\s+/g, '').substring(0, 20),
    domain: config.domain,
    defaultLat: config.lat,
    defaultLng: config.lng,
    defaultZoom: 16,
    buildings: config.buildings,
    courses: config.courses,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    logoEmoji: config.logo,
  };

  const frontendConfigPath = path.join(ROOT_DIR, 'frontend', 'src', 'lib', 'school-config.local.ts');
  const frontendConfigContent = `// Auto-generated by create-pulse-campus init
// Do not edit directly - run create-pulse-campus config instead

import { SchoolConfig } from './school-config';

export const schoolConfig: SchoolConfig = ${JSON.stringify(frontendConfig, null, 2)};
`;

  await fs.writeFile(frontendConfigPath, frontendConfigContent);
}

async function installDependencies() {
  const spinner = ora('Installing frontend dependencies...').start();
  try {
    await execa('npm', ['install'], { cwd: path.join(ROOT_DIR, 'frontend'), stdio: 'pipe' });
    spinner.succeed('Frontend dependencies installed');
  } catch (err) {
    spinner.fail('Frontend install failed');
    console.log(chalk.yellow('Run npm install manually in frontend/'));
  }

  spinner.start('Installing backend dependencies...');
  try {
    await execa('pip', ['install', '-r', 'requirements.txt'], { cwd: path.join(ROOT_DIR, 'backend'), stdio: 'pipe' });
    spinner.succeed('Backend dependencies installed');
  } catch (err) {
    spinner.fail('Backend install failed');
    console.log(chalk.yellow('Run pip install -r requirements.txt manually in backend/'));
  }
}

async function setupDatabase(config) {
  console.log(chalk.bold('\n🗄️  Database Setup (Supabase)'));
  console.log(chalk.gray('You need a Supabase project. Get credentials from https://supabase.com/dashboard'));
  
  const { hasSupabase } = await inquirer.prompt([{
    type: 'confirm',
    name: 'hasSupabase',
    message: 'Do you have Supabase credentials ready?',
    default: false
  }]);

  if (!hasSupabase) {
    console.log(chalk.yellow('\nSkipping database setup. Run these later:'));
    console.log(chalk.white('  1. Create project at https://supabase.com'));
    console.log(chalk.white('  2. Run backend/schema.sql in SQL Editor'));
    console.log(chalk.white('  3. Run backend/seed.sql for demo data'));
    console.log(chalk.white('  4. Enable Realtime for pulses & study_pods tables'));
    return;
  }

  const creds = await inquirer.prompt([
    { type: 'input', name: 'url', message: 'Supabase URL:', validate: v => v.startsWith('https://') || 'Must be https://' },
    { type: 'password', name: 'anonKey', message: 'Anon Key:' },
    { type: 'password', name: 'serviceKey', message: 'Service Role Key:' },
    { type: 'password', name: 'dbUrl', message: 'Database URL (from Connection Pooling):', validate: v => v.startsWith('postgresql://') || 'Must be postgresql://' },
  ]);

  const geminiKey = await inquirer.prompt([{
    type: 'password',
    name: 'key',
    message: 'Gemini API Key (from https://aistudio.google.com):'
  }]);

  // Write backend .env
  const backendEnv = `
GEMINI_API_KEY=${geminiKey.key}
SUPABASE_URL=${creds.url}
SUPABASE_SERVICE_KEY=${creds.serviceKey}
DATABASE_URL=${creds.dbUrl}
FRONTEND_URL=http://localhost:3000
VAPID_PRIVATE_KEY=
VAPID_PUBLIC_KEY=
VAPID_SUBJECT=mailto:admin@${config.domain}
SENTRY_DSN=
`.trim();

  await fs.writeFile(path.join(ROOT_DIR, 'backend', '.env'), backendEnv);

  // Write frontend .env.local
  const frontendEnv = `
NEXT_PUBLIC_SUPABASE_URL=${creds.url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${creds.anonKey}
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_LAT=${config.lat}
NEXT_PUBLIC_DEFAULT_LNG=${config.lng}
NEXT_PUBLIC_DEFAULT_ZOOM=16
NEXT_PUBLIC_SENTRY_DSN=
`.trim();

  await fs.writeFile(path.join(ROOT_DIR, 'frontend', '.env.local'), frontendEnv);

  console.log(chalk.green('\n✅ Environment files created'));
}

async function generateEnvFiles(config) {
  // VAPID keys
  const spinner = ora('Generating VAPID keys...').start();
  try {
    const { stdout } = await execa('python3', ['-c', `
from py_vapid import Vapid
v = Vapid()
v.generate_keys()
print(v.private_pem().decode())
print(v.public_pem().decode())
`]);
    const [privateKey, publicKey] = stdout.trim().split('\n');
    
    // Update backend .env with VAPID keys
    const envPath = path.join(ROOT_DIR, 'backend', '.env');
    let envContent = await fs.readFile(envPath, 'utf-8');
    envContent = envContent.replace('VAPID_PRIVATE_KEY=', `VAPID_PRIVATE_KEY=${privateKey.replace(/\n/g, '\\n')}`);
    envContent = envContent.replace('VAPID_PUBLIC_KEY=', `VAPID_PUBLIC_KEY=${publicKey.replace(/\n/g, '\\n')}`);
    await fs.writeFile(envPath, envContent);
    
    spinner.succeed('VAPID keys generated');
  } catch (err) {
    spinner.warn('VAPID key generation failed (install py-vapid)');
  }
}