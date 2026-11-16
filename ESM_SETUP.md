# Periyar Taxi Backend — ES Modules setup (Node.js 24)

This updated backend uses native `import`/`export` in every JavaScript source,
model factory, controller, router, worker, script and test. `package.json` has
`"type": "module"`; local relative imports include `.js`. `src/models/index.js`
exports all 24 Sequelize models by name.

There is deliberately **no dotenv dependency**. `src/config/env.js` loads the
root `.env` using Node's built-in `loadEnvFile()` on Node.js 22+/24. This prevents
the previously reported `Cannot find module 'dotenv'` error.

## Steps in macOS terminal

```bash
cd ~/Downloads/Periyar_Taxi_Backend_ESM
cp .env.example .env
# Set DB user/pass, JWT_SECRET, SUPER_ADMIN_PASSWORD, and any provider credentials
npm install
npm run check
npm test
npm run db:init
npm run db:seed
npm run dev
```

Before `npm run db:init`, create MySQL database `periyar_taxi`.
`db:init` is for an **empty development DB** only. If it already has live data,
use reviewed migrations and a backup rather than re-running schema sync.

You **must still install dependencies** (`npm install`) because this ZIP does not
include `node_modules`, at your request. A helpful preflight check runs before
`npm run dev` and prints any missing packages. Use `npm run dev`, not `nodemon
server.js`, unless you separately install and configure nodemon.

Node must be 22.16+; recommended: Node 24. This version does not rely on CommonJS
`require()` or `module.exports` anywhere in backend JS.

The source and the seven fare tests were checked without external packages.
Full database startup requires working local MySQL and npm package installation.
