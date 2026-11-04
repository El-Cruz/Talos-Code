import { execFileSync } from "node:child_process";

// Vercel: 0 skips the build; 1 runs it. Unknown history must run a build.
try {
  const base = process.env.VERCEL_GIT_PREVIOUS_SHA || "HEAD^";
  const paths = execFileSync("git", ["diff", "--name-only", "--no-renames", "-z", base, "HEAD"], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).split("\0").filter(Boolean);
  const irrelevant = path => /\.md$/i.test(path)
    || /\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)$/i.test(path)
    || /^(\.vscode\/|\.idea\/|\.codex\/|\.agent\/)/.test(path)
    || [".gitignore", ".editorconfig", "AGENTS.md", "CLAUDE.md"].includes(path);
  const skip = paths.length > 0 && paths.every(irrelevant);
  console.log(skip ? "Skipping: documentation, images or local configuration only." : "Building: application/deployment changes or empty diff.");
  process.exitCode = skip ? 0 : 1;
} catch {
  console.log("Building: previous Git revision unavailable.");
  process.exitCode = 1;
}
