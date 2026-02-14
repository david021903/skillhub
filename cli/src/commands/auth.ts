import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { get, post } from "../api.js";
import { setToken, clearToken, getToken, setUser, getUser, setApiUrl, getApiUrl } from "../config.js";

interface WhoamiResponse {
  id: string;
  handle: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function authCommands(program: Command) {
  const auth = program
    .command("auth")
    .description("Manage authentication");

  auth
    .command("login")
    .description("Authenticate with SkillHub")
    .option("--token <token>", "Use a personal access token")
    .option("--api-url <url>", "Set custom API URL")
    .action(async (options) => {
      if (options.apiUrl) {
        setApiUrl(options.apiUrl);
        console.log(chalk.gray(`API URL set to: ${options.apiUrl}`));
      }

      let token = options.token;

      if (!token) {
        console.log(chalk.cyan("\nTo authenticate, you need a personal access token."));
        console.log(chalk.gray("Create one at: " + getApiUrl() + "/settings#tokens\n"));
        
        const answers = await inquirer.prompt([
          {
            type: "password",
            name: "token",
            message: "Enter your personal access token:",
            mask: "*",
          },
        ]);
        token = answers.token;
      }

      const spinner = ora("Authenticating...").start();

      setToken(token);
      const { data, error } = await get<WhoamiResponse>("/api/cli/whoami");

      if (error) {
        spinner.fail("Authentication failed");
        clearToken();
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      setUser({
        id: data!.id,
        handle: data!.handle,
        firstName: data!.firstName,
        lastName: data!.lastName,
      });

      spinner.succeed("Authentication successful");
      console.log(chalk.green(`\nLogged in as ${chalk.bold("@" + data!.handle)}`));
    });

  auth
    .command("logout")
    .description("Sign out of SkillHub")
    .action(() => {
      clearToken();
      console.log(chalk.green("Logged out successfully"));
    });

  auth
    .command("status")
    .description("Check authentication status")
    .action(async () => {
      const token = getToken();
      
      if (!token) {
        console.log(chalk.yellow("Not logged in"));
        console.log(chalk.gray("Run `shsc auth login` to authenticate"));
        return;
      }

      const spinner = ora("Checking status...").start();
      const { data, error } = await get<WhoamiResponse>("/api/cli/whoami");

      if (error) {
        spinner.fail("Token invalid or expired");
        console.log(chalk.gray("Run `shsc auth login` to re-authenticate"));
        return;
      }

      spinner.succeed("Logged in");
      console.log(`\n  ${chalk.bold("User:")} @${data!.handle}`);
      if (data!.firstName) {
        console.log(`  ${chalk.bold("Name:")} ${data!.firstName} ${data!.lastName || ""}`);
      }
      if (data!.email) {
        console.log(`  ${chalk.bold("Email:")} ${data!.email}`);
      }
      console.log(`  ${chalk.bold("API:")} ${getApiUrl()}`);
    });

  program
    .command("whoami")
    .description("Show current logged in user")
    .action(async () => {
      const token = getToken();
      
      if (!token) {
        console.log(chalk.yellow("Not logged in"));
        process.exit(1);
      }

      const { data, error } = await get<WhoamiResponse>("/api/cli/whoami");

      if (error) {
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      console.log(`@${data!.handle}`);
    });
}
