import DocsLayout from "@/components/DocsLayout";

export default function Account() {
  return (
    <DocsLayout
      title="Creating an Account"
      description="Set up your SkillHub profile"
    >
      <h2>Registration Options</h2>
      <p>SkillHub offers two ways to create an account:</p>

      <h3>Email & Password</h3>
      <ol>
        <li>Go to <a href="https://skillhub.space">skillhub.space</a> and click <strong>Sign In</strong></li>
        <li>Switch to the <strong>Register</strong> tab</li>
        <li>Enter your email, choose a password, and pick a unique handle</li>
        <li>Optionally add your first and last name</li>
        <li>Click <strong>Create Account</strong></li>
      </ol>

      <h3>Google Sign-In</h3>
      <ol>
        <li>Click <strong>Sign In</strong> then click the <strong>Continue with Google</strong> button</li>
        <li>Authorize SkillHub to access your Google profile</li>
        <li>Your account is created automatically using your Google profile info</li>
      </ol>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> If you register with email first, you can link your Google 
          account later from Settings. Both methods will log you into the same account.
        </p>
      </div>

      <h2>Your Handle</h2>
      <p>
        Your handle is your unique username on SkillHub. It appears in your profile URL and 
        all your skill URLs:
      </p>
      <ul>
        <li>Profile: <code>skillhub.space/users/yourhandle</code></li>
        <li>Skills: <code>skillhub.space/skills/yourhandle/skill-name</code></li>
      </ul>
      <p>
        Handles must be lowercase, can contain letters, numbers, and hyphens, and must be 
        between 3 and 39 characters.
      </p>

      <h2>Profile Settings</h2>
      <p>After creating your account, customize your profile from <strong>Settings</strong>:</p>
      <ul>
        <li><strong>Display Name</strong> — Your first and last name shown on your profile</li>
        <li><strong>Bio</strong> — A short description about yourself (max 500 characters)</li>
        <li><strong>Avatar</strong> — Set via your linked Google account or Gravatar</li>
      </ul>

      <h2>Public Profile</h2>
      <p>
        Every user gets a public profile page showing their published skills and starred 
        skills. Visit yours at <code>skillhub.space/users/yourhandle</code>.
      </p>
      <p>
        Your profile includes tabs for:
      </p>
      <ul>
        <li><strong>Overview</strong> — Summary of your activity</li>
        <li><strong>Skills</strong> — All your published public skills</li>
        <li><strong>Stars</strong> — Skills you've starred</li>
      </ul>
    </DocsLayout>
  );
}
