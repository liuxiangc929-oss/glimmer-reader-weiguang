import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { createDailySummaryMiddleware } from './server/dailySummaryMiddleware';
import {
  createReadingAssistContextualMiddleware,
  createReadingAssistDirectMiddleware,
} from './server/readingAssistMiddleware';
import { createReviewQuestionsMiddleware } from './server/reviewQuestionsMiddleware';
import { createAnswerFeedbackMiddleware } from './server/answerFeedbackMiddleware';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      {
        name: 'glimmer-reader-daily-summary-api',
        configureServer(server) {
          server.middlewares.use('/api/daily-summary', createDailySummaryMiddleware(env));
          server.middlewares.use('/api/reading-assist/direct', createReadingAssistDirectMiddleware(env));
          server.middlewares.use('/api/reading-assist/contextual', createReadingAssistContextualMiddleware(env));
          server.middlewares.use('/api/review-questions', createReviewQuestionsMiddleware());
          server.middlewares.use('/api/answer-feedback', createAnswerFeedbackMiddleware());
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 3002,
      strictPort: true,
      allowedHosts: ['.trycloudflare.com'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
