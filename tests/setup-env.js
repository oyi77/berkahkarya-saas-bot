"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Load .env first so real DATABASE_URL is available for integration tests
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// Then set test defaults only for vars not in .env
if (!process.env.GEMINIGEN_API_KEY) {
    process.env.GEMINIGEN_API_KEY = 'test-geminigen-key';
}
if (!process.env.DEMO_MODE) {
    process.env.DEMO_MODE = 'false';
}
if (!process.env.BOT_TOKEN) {
    process.env.BOT_TOKEN = 'test-token:AAtest';
}
if (!process.env.DUITKU_MERCHANT_CODE) {
    process.env.DUITKU_MERCHANT_CODE = 'TEST001';
}
if (!process.env.DUITKU_API_KEY) {
    process.env.DUITKU_API_KEY = 'test-api-key';
}
//# sourceMappingURL=setup-env.js.map