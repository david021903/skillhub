import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { post } from "../api.js";

interface ValidationResult {
  passed: boolean;
  score: number;
  checks: Array<{
    id: string;
    category: string;
    status: "passed" | "failed" | "warning" | "skipped";
    message?: string;
  }>;
}

export function validateCommands(program: Command) {
  program
    .command("validate")
    .description("Validate the current skill before publishing")
    .option("-f, --file <path>", "Path to SKILL.md", "SKILL.md")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      const skillMdPath = path.resolve(process.cwd(), options.file);
      
      if (!fs.existsSync(skillMdPath)) {
        console.log(chalk.red(`File not found: ${skillMdPath}`));
        process.exit(1);
      }

      const skillMd = fs.readFileSync(skillMdPath, "utf-8");
      
      const spinner = ora("Validating skill...").start();
      const { data, error } = await post<ValidationResult>("/api/cli/validate", { skillMd });

      if (error || !data) {
        spinner.fail("Validation failed");
        console.log(chalk.red(`Error: ${error || "No data returned"}`));
        process.exit(1);
      }

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      console.log();
      
      if (data.passed) {
        console.log(chalk.green.bold("✓ Validation PASSED") + chalk.gray(` (${data.score}%)`));
      } else {
        console.log(chalk.red.bold("✗ Validation FAILED") + chalk.gray(` (${data.score}%)`));
      }

      console.log();

      type CheckType = typeof data.checks[number];
      const categories = new Map<string, CheckType[]>();
      for (const check of data.checks) {
        if (!categories.has(check.category)) {
          categories.set(check.category, []);
        }
        categories.get(check.category)!.push(check);
      }

      for (const [category, checks] of categories) {
        console.log(chalk.bold(`  ${category.toUpperCase()}`));
        
        for (const check of checks) {
          let icon: string;
          let color: typeof chalk;
          
          switch (check.status) {
            case "passed":
              icon = "✓";
              color = chalk.green;
              break;
            case "failed":
              icon = "✗";
              color = chalk.red;
              break;
            case "warning":
              icon = "!";
              color = chalk.yellow;
              break;
            default:
              icon = "-";
              color = chalk.gray;
          }
          
          console.log(`    ${color(icon)} ${check.message || check.id}`);
        }
        console.log();
      }

      if (!data!.passed) {
        console.log(chalk.gray("Fix the issues above before publishing."));
        process.exit(1);
      }
    });
}
