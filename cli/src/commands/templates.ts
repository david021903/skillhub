import { Command } from "commander";
import chalk from "chalk";
import { get, post } from "../api.js";
import fs from "fs";
import path from "path";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  skillMd?: string;
}

export function templateCommands(program: Command) {
  const templates = program
    .command("templates")
    .description("Browse and use skill templates");

  templates
    .command("list")
    .description("List all available skill templates")
    .option("-c, --category <category>", "Filter by category")
    .action(async (options) => {
      try {
        const response = await get<Template[]>("/api/templates");
        let templateList: Template[] = response.data || [];

        if (options.category) {
          templateList = templateList.filter(
            (t) => t.category.toLowerCase() === options.category.toLowerCase()
          );
        }

        if (templateList.length === 0) {
          console.log(chalk.yellow("No templates found"));
          return;
        }

        const categories = [...new Set(templateList.map((t) => t.category))];

        for (const category of categories) {
          console.log(chalk.bold.blue(`\n${category}:`));
          const catTemplates = templateList.filter((t) => t.category === category);
          for (const template of catTemplates) {
            console.log(`  ${chalk.green(template.id.padEnd(20))} ${template.name}`);
            console.log(`  ${" ".repeat(20)} ${chalk.dim(template.description)}`);
            if (template.tags.length > 0) {
              console.log(
                `  ${" ".repeat(20)} ${chalk.cyan(template.tags.map((t) => `#${t}`).join(" "))}`
              );
            }
          }
        }

        console.log(
          chalk.dim(`\nUse ${chalk.white("shsc templates init <template-id>")} to create a new skill from a template`)
        );
      } catch (error: any) {
        console.error(chalk.red("Failed to fetch templates:"), error.message);
        process.exit(1);
      }
    });

  templates
    .command("init")
    .description("Initialize a new skill from a template")
    .argument("<template-id>", "Template ID to use")
    .option("-o, --output <path>", "Output path for SKILL.md", "SKILL.md")
    .option("-f, --force", "Overwrite existing file")
    .action(async (templateId, options) => {
      try {
        const response = await get<Template>(`/api/templates/${templateId}`);
        if (!response.data) throw new Error("Template not found");
        const template: Template = response.data;

        const outputPath = path.resolve(options.output);

        if (fs.existsSync(outputPath) && !options.force) {
          console.error(
            chalk.red(`File already exists: ${outputPath}`)
          );
          console.log(chalk.dim("Use --force to overwrite"));
          process.exit(1);
        }

        fs.writeFileSync(outputPath, template.skillMd || "");

        console.log(chalk.green(`Created ${outputPath} from template "${template.name}"`));
        console.log(chalk.dim("\nNext steps:"));
        console.log(chalk.dim("  1. Edit SKILL.md with your skill details"));
        console.log(chalk.dim("  2. Run: shsc validate"));
        console.log(chalk.dim("  3. Run: shsc publish"));
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.error(chalk.red(`Template not found: ${templateId}`));
          console.log(chalk.dim("Run: shsc templates list"));
        } else {
          console.error(chalk.red("Failed to fetch template:"), error.message);
        }
        process.exit(1);
      }
    });

  templates
    .command("show")
    .description("Show details of a specific template")
    .argument("<template-id>", "Template ID to show")
    .action(async (templateId) => {
      try {
        const response = await get<Template>(`/api/templates/${templateId}`);
        if (!response.data) throw new Error("Template not found");
        const template: Template = response.data;

        console.log(chalk.bold.blue(template.name));
        console.log(chalk.dim(template.description));
        console.log();
        console.log(chalk.dim("Category:"), template.category);
        if (template.tags.length > 0) {
          console.log(chalk.dim("Tags:"), template.tags.map((t) => chalk.cyan(`#${t}`)).join(" "));
        }
        console.log();
        console.log(chalk.dim("--- SKILL.md Preview ---"));
        console.log(template.skillMd);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.error(chalk.red(`Template not found: ${templateId}`));
        } else {
          console.error(chalk.red("Failed to fetch template:"), error.message);
        }
        process.exit(1);
      }
    });
}
