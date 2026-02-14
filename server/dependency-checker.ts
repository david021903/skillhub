import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const VALID_BIN_PATTERN = /^[a-zA-Z0-9._-]+$/;
const COMMON_BINS = new Set([
  "node", "npm", "npx", "python", "python3", "pip", "pip3",
  "ruby", "gem", "go", "cargo", "rustc", "java", "javac",
  "git", "curl", "wget", "jq", "docker", "kubectl",
  "bash", "sh", "zsh", "make", "gcc", "g++", "clang",
  "ffmpeg", "imagemagick", "convert", "chromium", "chrome",
  "sqlite3", "psql", "mysql", "redis-cli", "mongod"
]);

export interface SkillDependencies {
  bins: string[];
  env: string[];
  skills: string[];
}

export interface DependencyCheckResult {
  name: string;
  type: "bin" | "env" | "skill";
  available: boolean;
  version?: string;
  message?: string;
}

export interface DependencyReport {
  allSatisfied: boolean;
  results: DependencyCheckResult[];
  summary: {
    total: number;
    satisfied: number;
    missing: number;
  };
}

function isValidBinName(bin: string): boolean {
  if (!bin || bin.length > 50) return false;
  if (!VALID_BIN_PATTERN.test(bin)) return false;
  if (bin.startsWith(".") || bin.startsWith("-")) return false;
  return true;
}

async function checkBinary(bin: string): Promise<DependencyCheckResult> {
  if (!isValidBinName(bin)) {
    return {
      name: bin,
      type: "bin",
      available: false,
      message: `Invalid binary name '${bin}'`
    };
  }

  try {
    const { stdout } = await execFileAsync("which", [bin]);
    const binPath = stdout.trim();
    
    if (!binPath) {
      return {
        name: bin,
        type: "bin",
        available: false,
        message: `Binary '${bin}' is not installed or not in PATH`
      };
    }

    return {
      name: bin,
      type: "bin",
      available: true,
      message: `Binary '${bin}' is available`
    };
  } catch {
    return {
      name: bin,
      type: "bin",
      available: false,
      message: `Binary '${bin}' is not installed or not in PATH`
    };
  }
}

function checkEnvVar(envVar: string): DependencyCheckResult {
  const value = process.env[envVar];
  const available = value !== undefined && value !== "";
  
  return {
    name: envVar,
    type: "env",
    available,
    message: available 
      ? `Environment variable '${envVar}' is set`
      : `Environment variable '${envVar}' is not set`
  };
}

async function checkSkill(skillRef: string, installedSkills: string[]): Promise<DependencyCheckResult> {
  const available = installedSkills.includes(skillRef);
  
  return {
    name: skillRef,
    type: "skill",
    available,
    message: available
      ? `Skill '${skillRef}' is installed`
      : `Skill '${skillRef}' is not installed. Run: shsc install ${skillRef}`
  };
}

export async function checkDependencies(
  dependencies: SkillDependencies,
  installedSkills: string[] = []
): Promise<DependencyReport> {
  const results: DependencyCheckResult[] = [];

  const binChecks = await Promise.all(
    (dependencies.bins || []).map(bin => checkBinary(bin))
  );
  results.push(...binChecks);

  const envChecks = (dependencies.env || []).map(env => checkEnvVar(env));
  results.push(...envChecks);

  const skillChecks = await Promise.all(
    (dependencies.skills || []).map(skill => checkSkill(skill, installedSkills))
  );
  results.push(...skillChecks);

  const satisfied = results.filter(r => r.available).length;
  const missing = results.filter(r => !r.available).length;

  return {
    allSatisfied: missing === 0,
    results,
    summary: {
      total: results.length,
      satisfied,
      missing
    }
  };
}

export function parseDependenciesFromSkillMd(content: string): SkillDependencies {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { bins: [], env: [], skills: [] };
  }

  const frontmatter = frontmatterMatch[1];
  
  const extractList = (section: string): string[] => {
    const regex = new RegExp(`${section}:\\s*\\n((?:\\s+-\\s+.+\\n?)+)`, "m");
    const match = frontmatter.match(regex);
    if (!match) return [];
    
    return match[1]
      .split("\n")
      .filter(line => line.trim().startsWith("-"))
      .map(line => line.replace(/^\s*-\s*/, "").trim())
      .filter(Boolean);
  };

  return {
    bins: extractList("bins"),
    env: extractList("env"),
    skills: extractList("skills")
  };
}
