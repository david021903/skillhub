import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { get } from "../api.js";

interface SearchResult {
  name: string;
  slug: string;
  description?: string;
  stars: number;
  downloads: number;
  owner: string;
}

export function searchCommands(program: Command) {
  program
    .command("search <query>")
    .description("Search for skills")
    .option("-l, --limit <number>", "Maximum results", "20")
    .action(async (query, options) => {
      const spinner = ora("Searching...").start();
      
      const { data, error } = await get<SearchResult[]>(
        `/api/cli/search?q=${encodeURIComponent(query)}&limit=${options.limit}`
      );

      if (error) {
        spinner.fail("Search failed");
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      spinner.stop();

      if (!data?.length) {
        console.log(chalk.yellow(`No skills found matching "${query}"`));
        return;
      }

      console.log(chalk.bold(`\nFound ${data.length} skill(s):\n`));
      
      for (const skill of data) {
        console.log(`  ${chalk.cyan(skill.owner)}/${chalk.bold(skill.slug)}`);
        if (skill.description) {
          console.log(`    ${chalk.gray(skill.description.slice(0, 80))}${skill.description.length > 80 ? "..." : ""}`);
        }
        console.log(`    ${chalk.yellow("★")} ${skill.stars}  ${chalk.blue("↓")} ${skill.downloads}`);
        console.log();
      }
    });

  program
    .command("browse")
    .description("Browse popular skills")
    .option("-l, --limit <number>", "Maximum results", "10")
    .option("-s, --sort <sort>", "Sort by: stars, downloads, latest", "stars")
    .action(async (options) => {
      const spinner = ora("Fetching skills...").start();
      
      const { data, error } = await get<any[]>(
        `/api/skills?sort=${options.sort}&limit=${options.limit}`
      );

      if (error) {
        spinner.fail("Failed to fetch skills");
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      spinner.stop();

      if (!data?.length) {
        console.log(chalk.yellow("No skills found"));
        return;
      }

      const sortLabel = options.sort === "stars" ? "Popular" : 
                        options.sort === "downloads" ? "Most Downloaded" : "Latest";
      
      console.log(chalk.bold(`\n${sortLabel} Skills:\n`));
      
      for (const skill of data) {
        const owner = skill.owner?.handle || "unknown";
        console.log(`  ${chalk.cyan(owner)}/${chalk.bold(skill.slug)}`);
        if (skill.description) {
          console.log(`    ${chalk.gray(skill.description.slice(0, 80))}${skill.description.length > 80 ? "..." : ""}`);
        }
        console.log(`    ${chalk.yellow("★")} ${skill.stars || 0}  ${chalk.blue("↓")} ${skill.downloads || 0}`);
        console.log();
      }
    });
}
