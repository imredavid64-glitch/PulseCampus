#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { deployCommand } from './commands/deploy.js';
import { configCommand } from './commands/config.js';
import { doctorCommand } from './commands/doctor.js';

program
  .name('create-pulse-campus')
  .description('Set up PulseCampus for your school in minutes')
  .version('1.0.0')
  .addHelpText('after', `
Examples:
  $ create-pulse-campus init                    # Interactive setup wizard
  $ create-pulse-campus init --school "My Uni"  # Quick setup with school name
  $ create-pulse-campus deploy                  # Deploy to Vercel + Render
  $ create-pulse-campus config                  # View/edit school config
  $ create-pulse-campus doctor                  # Check setup health
`);

program.addCommand(initCommand);
program.addCommand(deployCommand);
program.addCommand(configCommand);
program.addCommand(doctorCommand);

program.parseAsync(process.argv).catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});