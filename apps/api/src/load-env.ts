import fs from "fs";
import path from "path";

function loadEnv() {
  const paths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(__dirname, "../../../.env.local"),
    path.resolve(__dirname, "../../.env.local"),
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, ".env.local"),
  ];
  for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
      console.log(`[EnvLoader] Loading environment from: ${envPath}`);
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).replace(/^['"]|['"]$/g, "").trim();
            if (key && !process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
      break;
    }
  }
}

loadEnv();
