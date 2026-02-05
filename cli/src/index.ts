#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { authCommands } from "./commands/auth.js";
import { skillCommands } from "./commands/skills.js";
import { validateCommands } from "./commands/validate.js";
import { searchCommands } from "./commands/search.js";

const program = new Command();

program
  .name("skillbook")
  .description("SkillBook CLI - Manage OpenClaw skills from the command line")
  .version("1.0.0");

authCommands(program);
skillCommands(program);
validateCommands(program);
searchCommands(program);

program
  .command("help")
  .description("Show help for a command")
  .argument("[command]", "Command to get help for")
  .action((command) => {
    if (command) {
      const cmd = program.commands.find(c => c.name() === command);
      if (cmd) {
        cmd.outputHelp();
      } else {
        console.log(chalk.red(`Unknown command: ${command}`));
      }
    } else {
      program.outputHelp();
    }
  });

program.parse();
