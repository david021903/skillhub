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
    title: "1. Overview",
    content: (
      <>
        <p>
          This Privacy Policy explains how personal information is collected, used, and protected when you access or use
          TraderClaw Skills, including the website, registry, documentation, developer tools, APIs, CLI-related account
          surfaces, and related services.
        </p>
        <p>
          TraderClaw Skills is a product of TraderClaw and is operated by SpyFly INC — Republic of Panama. By using the
          Services, you agree to the practices described in this Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "information-collected",
    title: "2. Information We Collect",
    content: (
      <>
        <p>We may collect several categories of information when you interact with TraderClaw Skills.</p>
        <p><strong>Information you provide directly</strong></p>
        <ul>
          <li>name, username, profile information, and email address</li>
          <li>skill metadata, descriptions, files, repositories, comments, and support inquiries</li>
          <li>communications with us, including legal or support requests</li>
        </ul>
        <p><strong>Information collected automatically</strong></p>
        <ul>
          <li>IP address, browser type, device information, and session-level diagnostics</li>
          <li>pages viewed, referrers, interaction events, and performance telemetry</li>
          <li>request logs, error logs, and abuse-prevention signals</li>
        </ul>
        <p><strong>Developer and account activity</strong></p>
        <ul>
          <li>API token metadata such as creation time, last used time, and related identifiers</li>
          <li>registry activity such as skill publishing, starring, versioning, and profile updates</li>
          <li>AI feature prompts, submitted inputs, and generated outputs when you use those features</li>
        </ul>
      </>
    ),
  },
  {
    id: "self-hosted",
    title: "3. Information Collected by Self-Hosted Skills and Third-Party Services",
    content: (
      <>
        <p>
          TraderClaw Skills is primarily a hosted registry and developer platform. Skills published in the registry may
          be installed and run on infrastructure controlled by users or third parties.
        </p>
        <p>
          SpyFly INC does not operate user-controlled environments where self-hosted skills run, and does not collect
          operational data from those environments by default. Any data collected by self-hosted skills, repositories,
          model providers, exchanges, or external integrations is governed by those parties and your own configuration.
        </p>
      </>
    ),
  },
  {
    id: "use-of-information",
    title: "4. How We Use Information",
    content: (
      <>
        <p>We may use collected information to:</p>
        <ul>
          <li>operate, maintain, and secure TraderClaw Skills</li>
          <li>authenticate users and manage accounts, profiles, and API tokens</li>
          <li>host, index, and display registry content and related metadata</li>
          <li>improve search, validation, scoring, AI assistance, and developer workflows</li>
          <li>respond to inquiries, support requests, moderation actions, and legal requests</li>
          <li>monitor reliability, performance, abuse, fraud, and misuse of the Services</li>
        </ul>
        <p>We do not sell personal information to third parties.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "5. Cookies and Analytics",
    content: (
      <>
        <p>
          TraderClaw Skills may use cookies and similar technologies for authentication, session continuity, analytics,
          performance measurement, and abuse prevention.
        </p>
        <p>
          These technologies help us understand how users interact with the Services and improve usability, reliability,
          and security. You can manage certain cookie preferences through your browser settings.
        </p>
      </>
    ),
  },
  {
    id: "public-registry",
    title: "6. Public Registry Visibility",
    content: (
      <>
        <p>
          TraderClaw Skills is designed to make certain registry information public. Public profile pages, skill pages,
          and related registry surfaces may display:
        </p>
        <ul>
          <li>username, display name, avatar, and public bio</li>
          <li>published skill metadata, descriptions, versions, tags, and validation indicators</li>
          <li>public activity associated with published skills, where supported</li>
        </ul>
        <p>
          Please avoid submitting confidential, sensitive, or private information to public registry fields.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "7. Sharing and Disclosures",
    content: (
      <>
        <p>We may share information:</p>
        <ul>
          <li>with service providers that help us operate, secure, or analyze the Services</li>
          <li>with model or infrastructure providers where necessary to deliver requested AI features</li>
          <li>to comply with legal obligations, court orders, or lawful requests</li>
          <li>to investigate fraud, abuse, security incidents, or violations of our Terms</li>
          <li>in connection with a merger, acquisition, restructuring, or similar business transaction</li>
        </ul>
        <p>We do not sell personal information and do not disclose personal information for unrelated third-party marketing.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "8. Data Retention",
    content: (
      <>
        <p>
          We retain personal information only for as long as necessary to operate the Services, fulfill the purposes
          described in this Policy, comply with legal obligations, resolve disputes, and enforce agreements.
        </p>
        <p>
          Registry submissions, public profile data, support records, moderation records, and security logs may be
          retained for operational, legal, or abuse-prevention purposes.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "9. Security",
    content: (
      <>
        <p>
          We implement reasonable technical and organizational measures designed to protect information against
          unauthorized access, alteration, disclosure, or destruction.
        </p>
        <p>
          However, no internet-based system is completely secure. You are responsible for using strong credentials,
          protecting API tokens, and taking appropriate precautions when interacting with online services.
        </p>
      </>
    ),
  },
  {
    id: "international",
    title: "10. International Users",
    content: (
      <>
        <p>
          TraderClaw Skills may be accessed internationally, and information may be processed in jurisdictions where
          data protection laws differ from those in your country.
        </p>
        <p>
          By using the Services, you acknowledge that your information may be transferred to and processed in such
          jurisdictions, subject to applicable law.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "11. Your Rights",
    content: (
      <>
        <p>
          Depending on your jurisdiction, you may have rights relating to your personal information, including rights to:
        </p>
        <ul>
          <li>request access to your personal data</li>
          <li>request correction of inaccurate data</li>
          <li>request deletion of personal data, where applicable</li>
          <li>object to or restrict certain processing activities</li>
        </ul>
        <p>
          Requests may be submitted to{" "}
          <a href="mailto:legal@traderclaw.ai" className="text-primary hover:underline">
            legal@traderclaw.ai
          </a>.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "12. Children's Privacy",
    content: (
      <>
        <p>
          TraderClaw Skills is not intended for individuals under the age of 18. We do not knowingly collect personal
          information from children.
        </p>
      </>
    ),
  },
  {
    id: "changes-contact",
    title: "13. Changes to This Policy and Contact",
    content: (
      <>
        <p>
          SpyFly INC may update this Privacy Policy from time to time. Updated versions will be posted on this page with
          a revised <strong>Last updated</strong> date. Continued use of the Services after changes become effective
          constitutes acceptance of the updated Policy.
        </p>
        <p>
          For privacy or legal inquiries, contact:
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

export default function Privacy() {
  return (
    <LegalDocumentLayout
      tag="LEGAL"
      title="Privacy Policy"
      description="Privacy terms for TraderClaw Skills, the official TraderClaw registry and developer platform at skills.traderclaw.ai."
      canonicalPath="/privacy"
      lastUpdated="March 2026"
      sections={sections}
    />
  );
}
