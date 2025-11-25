import express from 'express';
import CursorRunnerCallbackController from '../controllers/cursor-runner-callback-controller';
import CursorRunnerCallbackService from '../services/cursor-runner-callback-service';
import TelegramService from '../services/telegram-service';
import ElevenLabsTextToSpeechService from '../services/elevenlabs-text-to-speech-service';

/**
 * Cursor Runner Routes (PHASE2-089)
 * 
 * Routes for cursor-runner API endpoints.
 * Matches Rails implementation in jarek-va/config/routes.rb:
 *   scope path: 'cursor-runner', as: 'cursor_runner' do
 *     post 'cursor/execute', to: 'cursor_runner#execute'
 *     post 'cursor/iterate', to: 'cursor_runner#iterate'
 *     post 'callback', to: 'cursor_runner_callback#create'
 *     post 'git/clone', to: 'cursor_runner#clone'
 *     get 'git/repositories', to: 'cursor_runner#repositories'
 *     post 'git/checkout', to: 'cursor_runner#checkout'
 *     post 'git/push', to: 'cursor_runner#push'
 *     post 'git/pull', to: 'cursor_runner#pull'
 *   end
 * 
 * References:
 * - jarek-va/app/controllers/cursor_runner_controller.rb
 * - jarek-va/app/controllers/cursor_runner_callback_controller.rb
 * 
 * Authentication:
 * - Callback endpoint requires webhook secret validation via X-Webhook-Secret
 *   or X-Cursor-Runner-Secret header
 * - Other endpoints may require authentication (to be implemented in controllers)
 * 
 * Note: CursorRunnerController will be implemented in a later task.
 * Route structure is complete but controller import is commented out until controller exists.
 */

const router = express.Router();

// TODO: Import CursorRunnerController when it's implemented
// import { CursorRunnerController } from '../controllers/cursor-runner.controller';

// Initialize callback controller (already exists)
const callbackService = new CursorRunnerCallbackService();
const telegramService = new TelegramService();
const textToSpeechService = new ElevenLabsTextToSpeechService();
const callbackController = new CursorRunnerCallbackController(
  callbackService,
  telegramService,
  textToSpeechService
);

// POST /cursor-runner/callback - Callback from cursor-runner
// This endpoint receives callbacks when cursor-runner completes an iterate operation.
// Authentication middleware (webhook secret validation) should be applied when registering routes.
router.post('/callback', callbackController.create.bind(callbackController));

// POST /cursor-runner/cursor/execute - Execute cursor command
// TODO: Uncomment when CursorRunnerController is implemented
// const cursorRunnerController = new CursorRunnerController();
// router.post('/cursor/execute', cursorRunnerController.execute.bind(cursorRunnerController));

// Placeholder route handler until controller is implemented
router.post('/cursor/execute', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Cursor runner controller not yet implemented'
  });
});

// POST /cursor-runner/cursor/iterate - Iterate cursor command (async)
// TODO: Uncomment when CursorRunnerController is implemented
// router.post('/cursor/iterate', cursorRunnerController.iterate.bind(cursorRunnerController));

// Placeholder route handler until controller is implemented
router.post('/cursor/iterate', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Cursor runner controller not yet implemented'
  });
});

// POST /cursor-runner/git/clone - Clone repository
// TODO: Uncomment when CursorRunnerController is implemented
// router.post('/git/clone', cursorRunnerController.clone.bind(cursorRunnerController));

// Placeholder route handler until controller is implemented
router.post('/git/clone', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Cursor runner controller not yet implemented'
  });
});

// GET /cursor-runner/git/repositories - List repositories
// TODO: Uncomment when CursorRunnerController is implemented
// router.get('/git/repositories', cursorRunnerController.repositories.bind(cursorRunnerController));

// Placeholder route handler until controller is implemented
router.get('/git/repositories', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Cursor runner controller not yet implemented'
  });
});

// POST /cursor-runner/git/checkout - Checkout branch
// TODO: Uncomment when CursorRunnerController is implemented
// router.post('/git/checkout', cursorRunnerController.checkout.bind(cursorRunnerController));

// Placeholder route handler until controller is implemented
router.post('/git/checkout', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Cursor runner controller not yet implemented'
  });
});

// POST /cursor-runner/git/push - Push branch
// TODO: Uncomment when CursorRunnerController is implemented
// router.post('/git/push', cursorRunnerController.push.bind(cursorRunnerController));

// Placeholder route handler until controller is implemented
router.post('/git/push', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Cursor runner controller not yet implemented'
  });
});

// POST /cursor-runner/git/pull - Pull branch
// TODO: Uncomment when CursorRunnerController is implemented
// router.post('/git/pull', cursorRunnerController.pull.bind(cursorRunnerController));

// Placeholder route handler until controller is implemented
router.post('/git/pull', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Cursor runner controller not yet implemented'
  });
});

export default router;
