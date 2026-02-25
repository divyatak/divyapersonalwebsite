/**
 * Walks through all info.txt files in public/projects/ and updates media lines
 * that reference .jpg, .jpeg, or .png files to .webp — but only if the .webp
 * version actually exists on disk. If the original file was kept (no .webp),
 * the line is left unchanged.
 */

import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectsRoot = join(__dirname, "..", "public", "projects");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(full)));
    } else if (entry.name === "info.txt") {
      results.push(full);
    }
  }
  return results;
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function processInfoFile(filePath) {
  const dir = join(filePath, "..");
  const content = await readFile(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  let changed = false;
  const changes = [];

  const newLines = await Promise.all(
    lines.map(async (line) => {
      const match = line.match(/^media:\s*(.+)$/);
      if (!match) return line;

      const mediaFile = match[1].trim();
      const ext = extname(mediaFile).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) return line;

      // Build the .webp filename
      const webpFile = mediaFile.slice(0, -ext.length) + ".webp";
      const webpPath = join(dir, webpFile);

      if (await fileExists(webpPath)) {
        const newLine = `media: ${webpFile}`;
        changes.push({ from: mediaFile, to: webpFile });
        changed = true;
        return newLine;
      }
      // .webp doesn't exist — keep original
      return line;
    })
  );

  if (changed) {
    await writeFile(filePath, newLines.join("\n"), "utf-8");
  }

  return { filePath, changes };
}

async function main() {
  const infoFiles = await walk(projectsRoot);
  console.log(`Found ${infoFiles.length} info.txt files.\n`);

  let totalChanges = 0;
  for (const f of infoFiles) {
    const { filePath, changes } = await processInfoFile(f);
    if (changes.length > 0) {
      const relative = filePath.replace(projectsRoot, "public/projects");
      console.log(relative);
      for (const c of changes) {
        console.log(`  ${c.from}  ->  ${c.to}`);
      }
      totalChanges += changes.length;
    }
  }

  console.log(`\nDone. ${totalChanges} media reference(s) updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
