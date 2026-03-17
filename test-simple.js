const { Telegraf } = require('telegraf');

const bot = new Telegraf('8696544399:AAGWVi96hW5DCpytP1HFeaRu1fhoj1qdywg');

async function main() {
  console.log('🧪 Direct bot test...');
  console.log('Calling bot.launch() NOW...');
  await bot.launch();
  console.log('✅ Bot stopped!');
}

main();
