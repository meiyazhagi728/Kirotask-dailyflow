import { createApp } from './app';
import { initDb } from './db';
import { upsertUser } from './modules/user/service';

const PORT = process.env.PORT ?? 3001;

initDb();
upsertUser();

const app = createApp();

app.listen(Number(PORT), () => {
  console.log(`\nDailyFlow API  ->  http://localhost:${PORT}`);
  console.log(`Health check   ->  http://localhost:${PORT}/health\n`);
});
