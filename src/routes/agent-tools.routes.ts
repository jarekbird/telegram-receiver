import express from 'express';

/**
 * Agent Tools Routes (PHASE2-089)
 * 
 * Routes for agent tools webhook endpoint.
 * Matches Rails implementation in jarek-va/config/routes.rb:
 *   post 'agent-tools', to: 'agent_tools#create'
 * 
 * Reference: jarek-va/app/controllers/agent_tools_controller.rb
 * 
 * Authentication: Requires webhook secret validation via X-EL-Secret header
 * or Authorization: Bearer <token> header
 * 
 * Note: Controller will be implemented in a later task.
 * Route structure is complete but controller import is commented out until controller exists.
 */

const router = express.Router();

// TODO: Import AgentToolsController when it's implemented
// import { AgentToolsController } from '../controllers/agent-tools.controller';

// POST /agent-tools - Agent tools webhook endpoint
// Note: Authentication middleware (webhook secret validation) should be applied
// when registering routes. The middleware will check X-EL-Secret header or
// Authorization: Bearer <token> header against WEBHOOK_SECRET.
// 
// Expected request body:
//   - tool: string (required) - Tool name to execute
//   - args: object (optional) - Tool arguments
//   - conversation_id: string (optional) - Conversation ID
//
// TODO: Uncomment when AgentToolsController is implemented
// const agentToolsController = new AgentToolsController();
// router.post('/', agentToolsController.create.bind(agentToolsController));

// Placeholder route handler until controller is implemented
router.post('/', (_req, res) => {
  res.status(501).json({
    ok: false,
    say: 'Agent tools controller not yet implemented',
    result: { error: 'Not implemented' }
  });
});

export default router;
