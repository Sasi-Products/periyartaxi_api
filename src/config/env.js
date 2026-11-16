// Native Node.js .env loader. Requires Node.js 22+ (Node 24 recommended).
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(backendRoot, '.env');
if (existsSync(envPath)) loadEnvFile(envPath);
