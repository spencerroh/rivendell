const fs = require("fs");

fs.cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
fs.cpSync("public", ".next/standalone/public", { recursive: true });

console.log("✓ Static files copied to standalone");
