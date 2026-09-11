import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'kaggriculture-api-handler',
      configureServer(server) {
        server.middlewares.use('/api/status', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'ok',
            version: '1.32.7',
            environment: 'kaggriculture',
            baselines: ['FARM-MIND-V1', 'FARM-MIND-V0', 'starter', 'random', 'pass'],
            defaultSteps: 720,
            defaultDays: 30,
            turnsPerDay: 24,
            boardSize: 10,
            shedCapacity: 100,
          }));
        });

        server.middlewares.use('/api/experiments', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          const expsFile = path.join(process.cwd(), 'experiments', 'experiments.json');
          if (fs.existsSync(expsFile)) {
            try {
              const data = fs.readFileSync(expsFile, 'utf-8');
              res.end(JSON.stringify({ success: true, data: JSON.parse(data) }));
              return;
            } catch (err: any) {
              res.end(JSON.stringify({ success: false, error: err.message }));
              return;
            }
          }
          res.end(JSON.stringify({ success: true, data: [] }));
        });

        server.middlewares.use('/api/recorded-match', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          const matchFile = path.join(process.cwd(), 'experiments', 'recorded_match.json');
          if (fs.existsSync(matchFile)) {
            try {
              const data = fs.readFileSync(matchFile, 'utf-8');
              res.end(JSON.stringify({ success: true, data: JSON.parse(data) }));
              return;
            } catch (err: any) {
              res.end(JSON.stringify({ success: false, error: err.message }));
              return;
            }
          }
          res.end(JSON.stringify({ success: false, error: 'No recorded match found' }));
        });

        server.middlewares.use('/api/profiler', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          const py = spawn('python3', ['-m', 'evaluation.profiler', '--agent', 'V1', '--seed', '42']);
          let out = '';
          py.stdout.on('data', d => { out += d; });
          py.on('close', code => {
            try {
              res.end(JSON.stringify({ success: code === 0, data: JSON.parse(out) }));
            } catch (e: any) {
              res.end(JSON.stringify({ success: false, raw: out }));
            }
          });
        });

        server.middlewares.use('/api/run', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }

          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const p0 = payload.p0 || 'starter';
              const p1 = payload.p1 || 'random';
              const seed = payload.seed !== undefined ? payload.seed : 42;
              const episodes = payload.episodes || 1;
              const steps = payload.steps || 720;

              const args = [
                '-m', 'evaluation.runner',
                '--p0', p0,
                '--p1', p1,
                '--seed', String(seed),
                '--steps', String(steps),
                '--episodes', String(episodes),
                '--snapshots',
                '--json'
              ];

              const py = spawn('python3', args);
              let stdout = '';
              let stderr = '';

              py.stdout.on('data', data => { stdout += data; });
              py.stderr.on('data', data => { stderr += data; });

              py.on('close', code => {
                res.setHeader('Content-Type', 'application/json');
                if (code === 0) {
                  try {
                    const parsed = JSON.parse(stdout);
                    res.end(JSON.stringify({ success: true, data: parsed }));
                  } catch (e) {
                    res.end(JSON.stringify({ success: false, raw: stdout, error: 'JSON parse error' }));
                  }
                } else {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: stderr || stdout, code }));
                }
              });
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
});
