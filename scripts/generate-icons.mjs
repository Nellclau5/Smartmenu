import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = readFileSync(join(root, "public/icons/logo.png"));

const sizes = [192, 512];

for (const size of sizes) {
  const png = await sharp(source).resize(size, size).png().toBuffer();
  writeFileSync(join(root, `public/icons/icon-${size}.png`), png);
}

const favicon = await sharp(source).resize(32, 32).png().toBuffer();
writeFileSync(join(root, "app/icon.png"), favicon);

const apple = await sharp(source).resize(180, 180).png().toBuffer();
writeFileSync(join(root, "app/apple-icon.png"), apple);

console.log("Icons generated from logo.png");
