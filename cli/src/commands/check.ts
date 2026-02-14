import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { getConfig } from "../config.js";

const API_BASE = process.env.SKILLHUB_API || "https://skillhub.space";

interface DependencyCheckResult {
  name: string;
  type: "bin" | "env" | "skill";
  available: boolean;
  version?: string;
  message?: string;
}

interface DependencyReport {
  allSatisfied: boolean;
  results: DependencyCheckResult[];
  summary: {
    total: number;
    satisfied: number;
    missing: number;
  };
}

export function checkCommands(program: Command) {
  const check = program
    .command("check")
    .description("Check skill dependencies");

  check
    .command("deps")
    .alias("dependencies")
    .description("Check if all dependencies for a skill are satisfied")
    .option("-f, --file <path>", "Path to SKILL.md file", "SKILL.md")
    .action(async (options) => {
      try {
        const filePath = path.resolve(options.file);
        
        if (!fs.existsSync(filePath)) {
          console.log(chalk.red(`Error: ${options.file} not found`));
          console.log(chalk.dim("Make sure you're in a skill directory with a SKILL.md file"));
          process.exit(1);
        }

        const skillMd = fs.readFileSync(filePath, "utf-8");
        
        const installedSkills = getInstalledSkills();

        console.log(chalk.bold("\nChecking dependencies...\n"));

        const config = getConfig();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        const endpoint = config.token 
          ? `${API_BASE}/api/cli/check-dependencies`
          : `${API_BASE}/api/check-dependencies`;
        
        if (config.token) {
          headers["Authorization"] = `Bearer ${config.token}`;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ skillMd, installedSkills }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(chalk.red(`Error: ${errorText}`));
          process.exit(1);
        }

        const report: DependencyReport = await response.json();

        const binResults = report.results.filter(r => r.type === "bin");
        const envResults = report.results.filter(r => r.type === "env");
        const skillResults = report.results.filter(r => r.type === "skill");

        if (binResults.length > 0) {
          console.log(chalk.bold.blue("Binaries:"));
          for (const result of binResults) {
            const icon = result.available ? chalk.green("✓") : chalk.red("✗");
            const name = result.available 
              ? chalk.green(result.name) 
              : chalk.red(result.name);
            const version = result.version ? chalk.dim(` v${result.version}`) : "";
            console.log(`  ${icon} ${name}${version}`);
          }
          console.log();
        }

        if (envResults.length > 0) {
          console.log(chalk.bold.blue("Environment Variables:"));
          for (const result of envResults) {
            const icon = result.available ? chalk.green("✓") : chalk.red("✗");
            const name = result.available 
              ? chalk.green(result.name) 
              : chalk.red(result.name);
            console.log(`  ${icon} ${name}`);
          }
          console.log();
        }

        if (skillResults.length > 0) {
          console.log(chalk.bold.blue("Required Skills:"));
          for (const result of skillResults) {
            const icon = result.available ? chalk.green("✓") : chalk.red("✗");
            const name = result.available 
              ? chalk.green(result.name) 
              : chalk.red(result.name);
            console.log(`  ${icon} ${name}`);
            if (!result.available) {
              console.log(chalk.dim(`      Run: shsc install ${result.name}`));
            }
          }
          console.log();
        }

        console.log(chalk.bold("Summary:"));
        console.log(`  Total: ${report.summary.total}`);
        console.log(`  ${chalk.green("Satisfied:")} ${report.summary.satisfied}`);
        console.log(`  ${chalk.red("Missing:")} ${report.summary.missing}`);
        console.log();

        if (report.allSatisfied) {
          console.log(chalk.green.bold("✓ All dependencies are satisfied!"));
        } else {
          console.log(chalk.yellow.bold("⚠ Some dependencies are missing"));
          console.log(chalk.dim("Install missing dependencies before using this skill"));
          process.exit(1);
        }
      } catch (error) {
        console.log(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  check
    .command("install-deps")
    .description("Show commands to install missing dependencies")
    .option("-f, --file <path>", "Path to SKILL.md file", "SKILL.md")
    .action(async (options) => {
      try {
        const filePath = path.resolve(options.file);
        
        if (!fs.existsSync(filePath)) {
          console.log(chalk.red(`Error: ${options.file} not found`));
          process.exit(1);
        }

        const skillMd = fs.readFileSync(filePath, "utf-8");
        const installedSkills = getInstalledSkills();

        const config = getConfig();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        const endpoint = config.token 
          ? `${API_BASE}/api/cli/check-dependencies`
          : `${API_BASE}/api/check-dependencies`;
        
        if (config.token) {
          headers["Authorization"] = `Bearer ${config.token}`;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ skillMd, installedSkills }),
        });

        if (!response.ok) {
          console.log(chalk.red("Error checking dependencies"));
          process.exit(1);
        }

        const report: DependencyReport = await response.json();
        const missing = report.results.filter(r => !r.available);

        if (missing.length === 0) {
          console.log(chalk.green("All dependencies are already satisfied!"));
          return;
        }

        console.log(chalk.bold("\nInstallation commands for missing dependencies:\n"));

        const missingBins = missing.filter(r => r.type === "bin");
        const missingEnvs = missing.filter(r => r.type === "env");
        const missingSkills = missing.filter(r => r.type === "skill");

        if (missingBins.length > 0) {
          console.log(chalk.bold.blue("Binaries (install via package manager):"));
          for (const bin of missingBins) {
            console.log(chalk.dim(`  # Install ${bin.name}`));
            console.log(`  brew install ${bin.name}  ${chalk.dim("# macOS")}`);
            console.log(`  apt install ${bin.name}   ${chalk.dim("# Ubuntu/Debian")}`);
            console.log(`  nix-env -iA nixpkgs.${bin.name}  ${chalk.dim("# Nix")}`);
            console.log();
          }
        }

        if (missingEnvs.length > 0) {
          console.log(chalk.bold.blue("Environment Variables:"));
          for (const env of missingEnvs) {
            console.log(`  export ${env.name}="your-value-here"`);
          }
          console.log();
        }

        if (missingSkills.length > 0) {
          console.log(chalk.bold.blue("Skills:"));
          for (const skill of missingSkills) {
            console.log(`  shsc install ${skill.name}`);
          }
          console.log();
        }
      } catch (error) {
        console.log(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}

function getInstalledSkills(): string[] {
  const skillsDir = path.join(process.env.HOME || "~", ".local", "skills");
  
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const skills: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        const skillMdPath = path.join(skillsDir, entry.name, "SKILL.md");
        if (fs.existsSync(skillMdPath)) {
          skills.push(entry.name);
        }
      }
    }

    return skills;
  } catch {
    return [];
  }
}
