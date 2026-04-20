import type { ReactNode } from "react";
import { LegalDocumentLayout } from "@/components/LegalDocumentLayout";

interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "1. Overview of the Services",
    content: (
      <>
        <p>
          These Terms and Conditions govern your access to and use of TraderClaw Skills, the official skill registry,
          developer surface, website, documentation, APIs, CLI tools, and related services available at
          <code> skills.traderclaw.ai </code>
          and associated TraderClaw properties.
        </p>
        <p>
          TraderClaw Skills may include the public skill registry, profile pages, publishing workflows, version
          management, validation and scoring systems, AI-powered assistance, API token management, documentation, and
          related developer resources.
        </p>
        <p>
          TraderClaw Skills is a software registry and developer platform. It does not provide custody of funds,
          brokerage services, investment management, financial advice, or execution services on behalf of users.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: (
      <>
        <p>You may use the Services only if:</p>
        <ul>
          <li>you are at least 18 years old</li>
          <li>you have the legal capacity to enter into binding agreements</li>
          <li>your use of the Services does not violate applicable laws or regulations in your jurisdiction</li>
        </ul>
        <p>
          You are solely responsible for determining whether your use of TraderClaw Skills is lawful in your
          jurisdiction.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "3. Accounts and Access",
    content: (
      <>
        <p>
          Certain features of TraderClaw Skills require an account, including publishing skills, starring content,
          generating API tokens, or using AI-assisted workflows.
        </p>
        <p>You are responsible for:</p>
        <ul>
          <li>providing accurate account and profile information</li>
          <li>maintaining the confidentiality of your credentials and API tokens</li>
          <li>all activity occurring under your account</li>
        </ul>
        <p>
          We may suspend or restrict access if we reasonably believe your account is being used in violation of these
          Terms or applicable law.
        </p>
      </>
    ),
  },
  {
    id: "publishing",
    title: "4. Skill Publishing and Registry Content",
    content: (
      <>
        <p>
          TraderClaw Skills allows developers and organizations to publish skills, metadata, documentation, files,
          version history, repository links, and related registry content.
        </p>
        <p>When you publish content, you are responsible for ensuring that:</p>
        <ul>
          <li>you have the rights and permissions needed to publish it</li>
          <li>the content is accurate to the best of your knowledge</li>
          <li>the content does not infringe intellectual property, privacy, or other rights</li>
          <li>the content does not contain malware, deceptive code, or unlawful material</li>
        </ul>
        <p>
          Registry entries may be publicly visible and may include metadata such as names, descriptions, tags, versions,
          validation results, download counts, and author profile details.
        </p>
      </>
    ),
  },
  {
    id: "license",
    title: "5. License to Use the Services",
    content: (
      <>
        <p>
          Subject to these Terms, SpyFly INC grants you a limited, non-exclusive, non-transferable, revocable license
          to access and use TraderClaw Skills and related client software made available by TraderClaw.
        </p>
        <p>This license permits you to:</p>
        <ul>
          <li>browse, search, and install skills from the registry</li>
          <li>use the CLI and APIs in accordance with the documentation</li>
          <li>publish and maintain your own skills and related content</li>
          <li>build integrations and workflows around the Services</li>
        </ul>
        <p>You may not:</p>
        <ul>
          <li>use the Services for unlawful, abusive, or deceptive purposes</li>
          <li>circumvent technical restrictions or access controls</li>
          <li>copy, resell, or distribute proprietary service components except as expressly permitted</li>
          <li>reverse engineer protected components where prohibited by law</li>
        </ul>
      </>
    ),
  },
  {
    id: "user-content",
    title: "6. User Content and Developer Submissions",
    content: (
      <>
        <p>
          You retain ownership of the content you submit to TraderClaw Skills. However, by submitting content, you grant
          SpyFly INC a worldwide, non-exclusive license to host, display, index, reproduce, adapt for presentation,
          distribute, and make available that content as necessary to operate, secure, improve, and promote the Services.
        </p>
        <p>
          This includes displaying skill pages, rendering metadata, indexing search results, presenting version history,
          generating previews, and reproducing content in registry and documentation surfaces.
        </p>
        <p>
          You represent and warrant that your submissions do not violate applicable law, sanctions, export controls,
          contractual obligations, or third-party rights.
        </p>
      </>
    ),
  },
  {
    id: "validation-ai",
    title: "7. Validation, Scoring, and AI Features",
    content: (
      <>
        <p>
          TraderClaw Skills may provide automated validation, scoring, linting, AI-generated suggestions, AI chat,
          explainers, or other automated outputs. These features are provided for convenience and informational purposes
          only.
        </p>
        <p>
          Automated outputs may be incomplete, outdated, inaccurate, insecure, or unsuitable for your intended use. You
          are responsible for reviewing and validating any generated or suggested content before relying on it.
        </p>
        <p>
          Validation badges, health scores, trust indicators, or similar signals are not guarantees of safety,
          correctness, legality, quality, or fitness for any purpose.
        </p>
      </>
    ),
  },
  {
    id: "self-hosted",
    title: "8. Self-Hosted Operation and Third-Party Skills",
    content: (
      <>
        <p>
          Many skills and tools listed on TraderClaw Skills are intended to run on infrastructure controlled by the user.
          Users remain fully responsible for the systems, environments, secrets, permissions, and dependencies they use.
        </p>
        <p>
          TraderClaw Skills may list third-party code, repositories, or integrations created by independent developers.
          SpyFly INC does not guarantee, endorse, audit, or assume responsibility for third-party skills, extensions, or
          integrations unless explicitly stated otherwise.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "9. Acceptable Use",
    content: (
      <>
        <p>You may not use the Services to:</p>
        <ul>
          <li>publish or distribute malware, backdoors, credential theft tools, or destructive code</li>
          <li>impersonate others or misrepresent ownership, authorship, or affiliation</li>
          <li>violate intellectual property, privacy, export, sanctions, or consumer protection laws</li>
          <li>harvest data or abuse the registry, APIs, or search systems in a way that harms the Services</li>
          <li>bypass rate limits, access controls, or moderation decisions</li>
          <li>upload content that is unlawful, fraudulent, defamatory, or otherwise harmful</li>
        </ul>
      </>
    ),
  },
  {
    id: "no-advice",
    title: "10. No Financial, Trading, or Security Advice",
    content: (
      <>
        <p>
          TraderClaw Skills is a software registry and developer platform. Some skills may relate to automation,
          analytics, market data, or trading-oriented workflows, but the Services themselves do not provide financial,
          investment, legal, or security advice.
        </p>
        <p>
          Any code, signals, templates, prompts, or outputs surfaced through the Services are informational in nature.
          You assume full responsibility for how you use them.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "11. Intellectual Property",
    content: (
      <>
        <p>
          All TraderClaw trademarks, branding, platform design, proprietary software components, documentation,
          screenshots, and related materials remain the property of SpyFly INC or its licensors, except where otherwise
          noted.
        </p>
        <p>
          Open-source components are governed by their respective license terms. Nothing in these Terms transfers
          ownership of TraderClaw intellectual property to you.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "12. Third-Party Services",
    content: (
      <>
        <p>
          The Services may link to or integrate with third-party repositories, hosting providers, analytics tools, model
          providers, community platforms, blockchain networks, exchanges, APIs, and other external services.
        </p>
        <p>
          SpyFly INC is not responsible for the availability, reliability, content, policies, or security of third-party
          services. Your use of those services is governed by their own terms and policies.
        </p>
      </>
    ),
  },
  {
    id: "tokens-security",
    title: "13. API Tokens and Account Security",
    content: (
      <>
        <p>
          API tokens and credentials issued through TraderClaw Skills are sensitive authentication materials. You are
          responsible for safeguarding them and for rotating or revoking them if compromised.
        </p>
        <p>
          SpyFly INC is not liable for losses or unauthorized activity resulting from your failure to secure credentials,
          systems, integrations, or self-hosted environments.
        </p>
      </>
    ),
  },
  {
    id: "moderation",
    title: "14. Moderation, Takedowns, and Removal",
    content: (
      <>
        <p>
          We may review, limit, unlist, remove, or disable content or accounts that we believe violate these Terms,
          create security risk, infringe rights, or expose the Services or users to harm.
        </p>
        <p>
          We may also comply with lawful takedown requests, court orders, or legal obligations requiring content removal,
          disclosure, or access restrictions.
        </p>
      </>
    ),
  },
  {
    id: "warranties",
    title: "15. No Warranties",
    content: (
      <>
        <p>
          The Services are provided on an <strong>as is</strong> and <strong>as available</strong> basis. To the maximum
          extent permitted by law, SpyFly INC disclaims all warranties, whether express, implied, or statutory,
          including warranties of merchantability, fitness for a particular purpose, title, non-infringement,
          uninterrupted availability, and error-free operation.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "16. Limitation of Liability",
    content: (
      <>
        <p>
          To the maximum extent permitted by law, SpyFly INC shall not be liable for any indirect, incidental, special,
          consequential, exemplary, or punitive damages, or for any loss of profits, revenue, data, goodwill, digital
          assets, trading outcomes, business opportunities, or other intangible losses arising out of or related to the
          Services.
        </p>
        <p>
          This includes losses arising from registry content, third-party skills, generated outputs, service downtime,
          moderation actions, account compromise, infrastructure failures, or third-party platform issues.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "17. Indemnification",
    content: (
      <>
        <p>
          You agree to indemnify, defend, and hold harmless SpyFly INC and its officers, directors, employees,
          contractors, and affiliates from any claims, damages, liabilities, losses, costs, and expenses arising out of
          or related to your content, your use of the Services, your violation of these Terms, or your violation of law
          or third-party rights.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "18. Changes to the Services and These Terms",
    content: (
      <>
        <p>
          SpyFly INC may modify, suspend, or discontinue parts of TraderClaw Skills at any time. We may also update
          these Terms from time to time by posting a revised version on the Services.
        </p>
        <p>
          Continued use of the Services after updated Terms become effective constitutes acceptance of the revised Terms.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "19. Governing Law and Contact",
    content: (
      <>
        <p>
          These Terms are governed by and interpreted in accordance with the laws of the Republic of Panama, without
          regard to conflict-of-law rules. Any disputes arising in connection with these Terms shall be subject to the
          jurisdiction of the competent courts of Panama.
        </p>
        <p>
          For legal inquiries regarding TraderClaw Skills, contact:
          <br />
          SpyFly INC — Republic of Panama
          <br />
          <a href="mailto:legal@traderclaw.ai" className="text-primary hover:underline">
            legal@traderclaw.ai
          </a>
        </p>
      </>
    ),
  },
];

export default function Terms() {
  return (
    <LegalDocumentLayout
      tag="LEGAL"
      title="Terms & Conditions"
      description="Terms governing access to TraderClaw Skills, the official TraderClaw registry for discovering, publishing, validating, and installing agent skills."
      canonicalPath="/terms"
      lastUpdated="March 2026"
      sections={sections}
    />
  );
}
