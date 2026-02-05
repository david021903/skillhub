interface ValidationCheck {
  id: string;
  category: string;
  status: "passed" | "failed" | "warning" | "skipped";
  message?: string;
}

interface ValidationResult {
  passed: boolean;
  score: number;
  checks: ValidationCheck[];
}

export async function validateSkillMd(content: string, manifest: Record<string, any>): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  checks.push({
    id: "manifest.001",
    category: "manifest",
    status: manifest.name ? "passed" : "failed",
    message: manifest.name ? "Skill name present" : "Missing required field: name",
  });

  checks.push({
    id: "manifest.002",
    category: "manifest",
    status: manifest.description ? "passed" : "warning",
    message: manifest.description ? "Description present" : "Missing description (recommended)",
  });

  checks.push({
    id: "skillmd.003",
    category: "skillmd",
    status: content.length > 50 ? "passed" : "warning",
    message: content.length > 50 ? "SKILL.md has sufficient content" : "SKILL.md content is very short",
  });

  checks.push({
    id: "skillmd.004",
    category: "skillmd",
    status: content.toLowerCase().includes("## ") ? "passed" : "warning",
    message: content.toLowerCase().includes("## ") ? "Has section headers" : "Consider adding section headers",
  });

  const securityPatterns = [
    { pattern: /PRIVATE.*KEY/i, message: "Possible private key reference" },
    { pattern: /password\s*[:=]\s*["'][^"']+["']/i, message: "Possible hardcoded password" },
    { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/i, message: "Possible hardcoded API key" },
  ];

  let securityPassed = true;
  for (const { pattern, message } of securityPatterns) {
    if (pattern.test(content)) {
      checks.push({
        id: `security.${checks.length + 1}`,
        category: "security",
        status: "failed",
        message,
      });
      securityPassed = false;
    }
  }

  if (securityPassed) {
    checks.push({
      id: "security.005",
      category: "security",
      status: "passed",
      message: "No obvious security issues found",
    });
  }

  const hasPermissionsSection = /permissions|safety/i.test(content);
  checks.push({
    id: "skillmd.006",
    category: "skillmd",
    status: hasPermissionsSection ? "passed" : "warning",
    message: hasPermissionsSection ? "Has permissions/safety section" : "Consider adding a permissions or safety section",
  });

  if (manifest.metadata?.openclaw) {
    checks.push({
      id: "compat.007",
      category: "compat",
      status: "passed",
      message: "OpenClaw metadata present",
    });

    if (manifest.metadata.openclaw.requires) {
      checks.push({
        id: "compat.008",
        category: "compat",
        status: "passed",
        message: "Requirements declared",
      });
    }
  } else {
    checks.push({
      id: "compat.007",
      category: "compat",
      status: "warning",
      message: "Consider adding metadata.openclaw for better OpenClaw integration",
    });
  }

  const passed = checks.filter(c => c.status === "passed").length;
  const failed = checks.filter(c => c.status === "failed").length;
  const total = checks.length;
  
  const score = Math.round((passed / total) * 100);
  const allPassed = failed === 0;

  return {
    passed: allPassed,
    score,
    checks,
  };
}
