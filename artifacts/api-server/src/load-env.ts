import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root is 3 levels up from artifacts/api-server/src
config({ path: path.resolve(__dirname, "../../../.env") });
