import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { get, post } from "../api.js";
import { getToken, getUser } from "../config.js";

interface PublishResponse {
  skill: { owner: string; slug: string };
  version: string;
  validation: {
    passed: boolean;
    score: number;
    checks: Array<{ id: string; status: string; message?: string }>;
  };
}

interface FileInfo {
  path: string;
  content: string;
  size: number;
  isBinary: boolean;
}

interface InstallResponse {
  skill: { name: string; slug: string; owner: string };
  version: string;
  skillMd: string;
  manifest: Record<string, unknown>;
  readme?: string;
  files?: FileInfo[];
}

const IGNORED_FILES = [
  ".git",
  ".gitignore",
  "node_modules",
  ".DS_Store",
  "Thumbs.db",
  ".env",
  ".env.local",
  ".skillignore",
  "SKILL.md",
  "README.md",
];

const IGNORED_EXTENSIONS = [".pyc", ".pyo", ".class", ".o", ".a", ".so", ".dll", ".exe"];

function shouldIgnoreFile(filePath: string): boolean {
  const name = path.basename(filePath);
  if (IGNORED_FILES.includes(name)) return true;
  if (filePath.includes("node_modules/") || filePath.includes(".git/")) return true;
  if (IGNORED_EXTENSIONS.some(ext => name.endsWith(ext))) return true;
  
  const skillignorePath = path.join(process.cwd(), ".skillignore");
  if (fs.existsSync(skillignorePath)) {
    const patterns = fs.readFileSync(skillignorePath, "utf-8").split("\n").filter(l => l.trim() && !l.startsWith("#"));
    for (const pattern of patterns) {
      if (filePath.includes(pattern.trim())) return true;
    }
  }
  return false;
}

function collectFiles(dir: string, base: string = ""): Array<{path: string; content: string}> {
  const results: Array<{path: string; content: string}> = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = base ? `${base}/${entry.name}` : entry.name;
    
    if (shouldIgnoreFile(relativePath)) continue;
    
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, relativePath));
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const isBinary = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(content.slice(0, 1000));
        if (!isBinary && content.length < 1024 * 1024) {
          results.push({ path: relativePath, content });
        }
      } catch (e) {
        // Skip files that can't be read as text
      }
    }
  }
  
  return results;
}

export function skillCommands(program: Command) {
  program
    .command("init")
    .description("Initialize a new skill in the current directory")
    .option("-n, --name <name>", "Skill name")
    .option("-s, --slug <slug>", "Skill slug (URL-friendly)")
    .action(async (options) => {
      const skillMdPath = path.join(process.cwd(), "SKILL.md");
      
      if (fs.existsSync(skillMdPath)) {
        console.log(chalk.yellow("SKILL.md already exists in this directory"));
        return;
      }

      const name = options.name || path.basename(process.cwd());
      const slug = options.slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const template = `---
name: ${name}
version: 1.0.0
description: A brief description of your skill
metadata:
  openclaw:
    requires:
      bins: []
      env: []
tags:
  - utility
---

# ${name}

## Overview

Describe what your skill does and why it's useful.

## Usage

Explain how to use this skill with examples.

## Examples

\`\`\`
Example usage here
\`\`\`

## Requirements

List any requirements or dependencies.
`;

      fs.writeFileSync(skillMdPath, template);
      console.log(chalk.green("Created SKILL.md"));
      console.log(chalk.gray("\nEdit the file, then run:"));
      console.log(chalk.cyan(`  shsc publish`));
    });

  program
    .command("publish")
    .description("Publish the current skill to SkillHub")
    .option("-v, --version <version>", "Version to publish")
    .option("-m, --message <message>", "Changelog message")
    .action(async (options) => {
      if (!getToken()) {
        console.log(chalk.red("Not logged in. Run `shsc auth login` first."));
        process.exit(1);
      }

      const user = getUser();
      if (!user) {
        console.log(chalk.red("User info not found. Run `shsc auth login` first."));
        process.exit(1);
      }

      const skillMdPath = path.join(process.cwd(), "SKILL.md");
      
      if (!fs.existsSync(skillMdPath)) {
        console.log(chalk.red("SKILL.md not found in current directory"));
        console.log(chalk.gray("Run `shsc init` to create one"));
        process.exit(1);
      }

      const skillMd = fs.readFileSync(skillMdPath, "utf-8");
      
      const frontmatterMatch = skillMd.match(/^---\n([\s\S]*?)\n---/);
      let manifest: Record<string, unknown> = {};
      if (frontmatterMatch) {
        const lines = frontmatterMatch[1].split("\n");
        for (const line of lines) {
          const [key, ...valueParts] = line.split(":");
          if (key && valueParts.length) {
            manifest[key.trim()] = valueParts.join(":").trim();
          }
        }
      }

      const name = (manifest.name as string) || path.basename(process.cwd());
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const version = options.version || (manifest.version as string) || "1.0.0";

      console.log(chalk.cyan(`\nPublishing ${chalk.bold(name)} v${version}...`));
      
      const spinner = ora("Collecting files...").start();

      const readmePath = path.join(process.cwd(), "README.md");
      const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf-8") : undefined;

      // Collect additional files from the directory
      const additionalFiles = collectFiles(process.cwd());
      if (additionalFiles.length > 0) {
        spinner.text = `Uploading ${additionalFiles.length + 1} files...`;
      } else {
        spinner.text = "Uploading and validating...";
      }

      const { data, error } = await post<PublishResponse>(
        `/api/cli/skills/${user.handle}/${slug}/publish`,
        {
          version,
          skillMd,
          readme,
          changelog: options.message,
          files: additionalFiles,
        }
      );

      if (error) {
        spinner.fail("Publish failed");
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      spinner.succeed("Published successfully!");
      
      console.log(`\n  ${chalk.bold("Skill:")} ${data!.skill.owner}/${data!.skill.slug}`);
      console.log(`  ${chalk.bold("Version:")} ${data!.version}`);
      console.log(`  ${chalk.bold("Validation:")} ${data!.validation.passed ? chalk.green("PASSED") : chalk.red("FAILED")} (${data!.validation.score}%)`);
      
      if (!data!.validation.passed) {
        console.log(chalk.yellow("\n  Validation issues:"));
        for (const check of data!.validation.checks) {
          if (check.status === "failed") {
            console.log(chalk.red(`    - ${check.message}`));
          } else if (check.status === "warning") {
            console.log(chalk.yellow(`    - ${check.message}`));
          }
        }
      }

      console.log(chalk.gray(`\n  Install with: shsc install ${data!.skill.owner}/${data!.skill.slug}`));
    });

  program
    .command("install <skill>")
    .description("Install a skill (format: owner/name or owner/name@version)")
    .option("-o, --output <dir>", "Output directory", ".local/skills")
    .action(async (skill, options) => {
      const match = skill.match(/^([^/]+)\/([^@]+)(?:@(.+))?$/);
      
      if (!match) {
        console.log(chalk.red("Invalid skill format. Use: owner/name or owner/name@version"));
        process.exit(1);
      }

      const [, owner, slug, version] = match;
      const spinner = ora(`Installing ${skill}...`).start();

      const endpoint = version 
        ? `/api/cli/skills/${owner}/${slug}/install?version=${version}`
        : `/api/cli/skills/${owner}/${slug}/install`;

      const { data, error } = await get<InstallResponse>(endpoint);

      if (error) {
        spinner.fail("Install failed");
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      const outputDir = path.join(process.cwd(), options.output, slug);
      fs.mkdirSync(outputDir, { recursive: true });
      
      fs.writeFileSync(path.join(outputDir, "SKILL.md"), data!.skillMd);
      
      if (data!.readme) {
        fs.writeFileSync(path.join(outputDir, "README.md"), data!.readme);
      }

      // Save additional files with path traversal protection
      let fileCount = 1;
      if (data!.files && data!.files.length > 0) {
        for (const file of data!.files) {
          if (file.path && file.content && !file.isBinary) {
            // Normalize and validate path to prevent traversal attacks
            const normalizedPath = path.normalize(file.path).replace(/^(\.\.(\/|\\|$))+/, '');
            if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
              console.log(chalk.yellow(`  Skipping unsafe path: ${file.path}`));
              continue;
            }
            const filePath = path.join(outputDir, normalizedPath);
            // Ensure the resolved path is within outputDir
            const resolvedPath = path.resolve(filePath);
            const resolvedOutputDir = path.resolve(outputDir);
            if (!resolvedPath.startsWith(resolvedOutputDir + path.sep)) {
              console.log(chalk.yellow(`  Skipping unsafe path: ${file.path}`));
              continue;
            }
            const fileDir = path.dirname(filePath);
            fs.mkdirSync(fileDir, { recursive: true });
            fs.writeFileSync(filePath, file.content);
            fileCount++;
          }
        }
      }

      spinner.succeed(`Installed ${chalk.bold(data!.skill.name)} v${data!.version}`);
      console.log(chalk.gray(`  Location: ${outputDir}`));
      if (fileCount > 1) {
        console.log(chalk.gray(`  Files: ${fileCount}`));
      }
    });

  program
    .command("info <skill>")
    .description("Show information about a skill")
    .action(async (skill) => {
      const match = skill.match(/^([^/]+)\/([^@]+)$/);
      
      if (!match) {
        console.log(chalk.red("Invalid skill format. Use: owner/name"));
        process.exit(1);
      }

      const [, owner, slug] = match;
      const spinner = ora("Fetching skill info...").start();

      const { data, error } = await get<any>(`/api/skills/${owner}/${slug}`);

      if (error) {
        spinner.fail("Failed to fetch skill");
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      spinner.stop();

      console.log(`\n${chalk.bold.cyan(data.name)}`);
      console.log(chalk.gray(data.description || "No description"));
      console.log();
      console.log(`  ${chalk.bold("Owner:")} @${data.owner?.handle || owner}`);
      console.log(`  ${chalk.bold("Stars:")} ${data.stars || 0}`);
      console.log(`  ${chalk.bold("Downloads:")} ${data.downloads || 0}`);
      if (data.versions?.length) {
        console.log(`  ${chalk.bold("Latest:")} v${data.versions[0].version}`);
        console.log(`  ${chalk.bold("Versions:")} ${data.versions.length}`);
      }
      if (data.tags?.length) {
        console.log(`  ${chalk.bold("Tags:")} ${data.tags.join(", ")}`);
      }
      console.log();
      console.log(chalk.gray(`Install: shsc install ${owner}/${slug}`));
    });

  program
    .command("list")
    .description("List your published skills")
    .action(async () => {
      if (!getToken()) {
        console.log(chalk.red("Not logged in. Run `shsc auth login` first."));
        process.exit(1);
      }

      const spinner = ora("Fetching your skills...").start();
      const { data, error } = await get<any[]>("/api/my-skills");

      if (error) {
        spinner.fail("Failed to fetch skills");
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      spinner.stop();

      if (!data?.length) {
        console.log(chalk.yellow("You haven't published any skills yet."));
        console.log(chalk.gray("Run `shsc init` to create your first skill."));
        return;
      }

      console.log(chalk.bold(`\nYour skills (${data.length}):\n`));
      
      for (const skill of data) {
        const visibility = skill.isPublic ? chalk.green("public") : chalk.gray("private");
        console.log(`  ${chalk.cyan(skill.name)} ${chalk.gray("(" + skill.slug + ")")}`);
        console.log(`    ${visibility} · ${skill.stars || 0} stars · ${skill.downloads || 0} downloads`);
      }
    });

  program
    .command("star <skill>")
    .description("Star a skill")
    .action(async (skill) => {
      if (!getToken()) {
        console.log(chalk.red("Not logged in. Run `shsc auth login` first."));
        process.exit(1);
      }

      const match = skill.match(/^([^/]+)\/([^@]+)$/);
      if (!match) {
        console.log(chalk.red("Invalid skill format. Use: owner/name"));
        process.exit(1);
      }

      const [, owner, slug] = match;
      
      const { data: skillData, error: skillError } = await get<any>(`/api/skills/${owner}/${slug}`);
      if (skillError) {
        console.log(chalk.red(`Error: ${skillError}`));
        process.exit(1);
      }

      const { data, error } = await post<{ starred: boolean }>(`/api/skills/${skillData.id}/star`);
      
      if (error) {
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      if (data?.starred) {
        console.log(chalk.green(`Starred ${skill}`));
      } else {
        console.log(chalk.gray(`Unstarred ${skill}`));
      }
    });
}
