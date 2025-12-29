import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Context } from 'hono';
import fund from './routes/fund.js';

const app = new Hono();

app.use('/*', cors());

app.get('/health', (c: Context) => {
    return c.json({ status: 'ok', service: 'faucet-api' });
});

app.route('/fund', fund);

app.get('/', (c: Context) => {
    return c.json({
        service: 'Midnight Faucet API',
        version: '0.1.0',
        endpoints: {
            health: 'GET /health',
            fund: 'POST /fund',
        },
    });
});

const port = Number.parseInt(process.env['PORT'] ?? '3000', 10);
const hostname = process.env['HOSTNAME'] ?? '0.0.0.0';

console.log(`🚀 Faucet API server starting on ${hostname}:${port}`);

Bun.serve({
    port,
    hostname,
    fetch: app.fetch,
});

