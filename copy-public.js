const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "public");
const destDir = path.join(__dirname, "dist", "public");

// Create dist/public if missing
fs.mkdirSync(destDir, { recursive: true });

// Copy every file from /public → /dist/public
fs.readdirSync(srcDir).forEach(file => {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);

  fs.copyFileSync(src, dest);
  console.log(`Copied: ${file}`);
});

console.log("Public folder copied successfully!");
