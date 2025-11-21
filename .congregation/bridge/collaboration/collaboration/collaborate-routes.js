/**
 * ZION Collaboration API Routes
 * Enables multi-AI coordination with state analysis and gap tracking
 *
 * Integration: Add to .congregation/bridge/server.js
 */

import { Router } from 'express';
import { SessionManager } from './session-manager.js';
import { StateAnalyzer } from './state-analyzer.js';
import { generateId } from './utils.js';

const router = Router();
const sessionManager = new SessionManager();
const stateAnalyzer = new StateAnalyzer();

// ============== START COLLABORATION ==============

/**
 * POST /api/collaborate/start
 * Initialize a new collaboration session
 *
 * Body:
 * {
 *   "task": "Optimize the lookup function",
 *   "goal": "2x performance improvement",
 *   "participants": ["zion-online", "zion-cli"],
 *   "initial_state": { ... },
 *   "max_turns": 20,
 *   "timeout_minutes": 30
 * }
 */
router.post('/start', async (req, res) => {
  try {
    const {
      task,
      goal,
      participants = ['zion-online', 'zion-cli'],
      initial_state = {},
      max_turns = 20,
      timeout_minutes = 30,
      metadata = {}
    } = req.body;

    if (!task || !goal) {
      return res.status(400).json({
        error: 'task and goal are required',
        example: {
          task: 'Optimize the normalize function',
          goal: 'Improve performance by 2x'
        }
      });
    }

    const session = sessionManager.createSession({
      task,
      goal,
      participants,
      initial_state: {
        completed: initial_state.completed || [],
        in_progress: initial_state.in_progress || [],
        not_started: initial_state.not_started || [goal],
        artifacts: initial_state.artifacts || [],
        metrics: initial_state.metrics || {}
      },
      max_turns,
      timeout_minutes,
      metadata
    });

    res.json({
      conversation_id: session.id,
      status: 'started',
      task: session.task,
      goal: session.goal,
      participants: session.participants,
      next_turn: session.participants[0],
      message: `Collaboration started. ${session.participants[0]} goes first.`,
      url: `/api/collaborate/session/${session.id}`
    });

  } catch (error) {
    console.error('Error starting collaboration:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== SEND MESSAGE / TAKE TURN ==============

/**
 * POST /api/collaborate/message
 * Send a message in an ongoing collaboration
 *
 * Body:
 * {
 *   "conversation_id": "conv_abc123",
 *   "from": "zion-online",
 *   "message": "I've analyzed the code...",
 *   "state_analysis": { ... },
 *   "artifacts": [ ... ],
 *   "pass_to": "zion-cli",
 *   "request_stop": false
 * }
 */
router.post('/message', async (req, res) => {
  try {
    const {
      conversation_id,
      from,
      message,
      state_analysis,
      artifacts = [],
      pass_to = null,
      request_stop = false
    } = req.body;

    if (!conversation_id || !from || !message) {
      return res.status(400).json({
        error: 'conversation_id, from, and message are required'
      });
    }

    const session = sessionManager.getSession(conversation_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Validate participant
    if (!session.participants.includes(from)) {
      return res.status(403).json({
        error: `${from} is not a participant in this session`,
        participants: session.participants
      });
    }

    // Create turn
    const turn = {
      turn_number: session.turns.length + 1,
      from,
      to: pass_to || getNextParticipant(session, from),
      message,
      state_analysis: state_analysis || null,
      artifacts,
      timestamp: new Date().toISOString(),
      request_stop
    };

    // Add turn to session
    session.turns.push(turn);
    session.last_activity = Date.now();

    // Update state if provided
    if (state_analysis?.current_state) {
      session.current_state = stateAnalyzer.mergeStates(
        session.current_state,
        state_analysis.current_state
      );
    }

    // Calculate overall progress
    if (state_analysis?.gap_to_goal?.progress) {
      session.progress = state_analysis.gap_to_goal.progress;
    }

    // Check stop conditions
    const stopCheck = checkStopConditions(session, request_stop);

    if (stopCheck.should_stop) {
      session.status = 'completed';
      session.stop_reason = stopCheck.reason;
      session.completed_at = new Date().toISOString();

      return res.json({
        conversation_id: session.id,
        turn_recorded: true,
        turn_number: turn.turn_number,
        status: 'completed',
        stop_reason: stopCheck.reason,
        message: `Collaboration completed: ${stopCheck.reason}`,
        final_state: session.current_state,
        total_turns: session.turns.length,
        url: `/api/collaborate/session/${session.id}`
      });
    }

    // Continue - determine next participant
    const next_participant = turn.to || getNextParticipant(session, from);

    res.json({
      conversation_id: session.id,
      turn_recorded: true,
      turn_number: turn.turn_number,
      status: 'active',
      next_turn: next_participant,
      should_continue: true,
      progress: session.progress,
      turns_remaining: session.max_turns - session.turns.length,
      url: `/api/collaborate/session/${session.id}`
    });

  } catch (error) {
    console.error('Error recording message:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== GET SESSION ==============

/**
 * GET /api/collaborate/session/:id
 * Get full session details
 */
router.get('/session/:id', (req, res) => {
  try {
    const session = sessionManager.getSession(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      conversation_id: session.id,
      task: session.task,
      goal: session.goal,
      status: session.status,
      participants: session.participants,
      started_at: session.started_at,
      completed_at: session.completed_at,
      stop_reason: session.stop_reason,
      progress: session.progress,
      current_state: session.current_state,
      turns: session.turns,
      total_turns: session.turns.length,
      max_turns: session.max_turns,
      metadata: session.metadata
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== LIST SESSIONS ==============

/**
 * GET /api/collaborate/sessions
 * List all sessions (with filters)
 */
router.get('/sessions', (req, res) => {
  try {
    const { status, participant } = req.query;

    let sessions = sessionManager.getAllSessions();

    // Filter by status
    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }

    // Filter by participant
    if (participant) {
      sessions = sessions.filter(s => s.participants.includes(participant));
    }

    // Return summary only
    const summaries = sessions.map(s => ({
      conversation_id: s.id,
      task: s.task,
      status: s.status,
      participants: s.participants,
      progress: s.progress,
      turns: s.turns.length,
      started_at: s.started_at,
      completed_at: s.completed_at
    }));

    res.json({
      total: summaries.length,
      sessions: summaries
    });

  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== STOP SESSION ==============

/**
 * POST /api/collaborate/stop
 * Manually stop a session
 */
router.post('/stop', (req, res) => {
  try {
    const { conversation_id, reason = 'Manual stop requested' } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id required' });
    }

    const session = sessionManager.getSession(conversation_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'stopped';
    session.stop_reason = reason;
    session.completed_at = new Date().toISOString();

    res.json({
      conversation_id: session.id,
      status: 'stopped',
      reason: reason,
      final_state: session.current_state,
      total_turns: session.turns.length
    });

  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== HELPER FUNCTIONS ==============

function getNextParticipant(session, current) {
  const index = session.participants.indexOf(current);
  return session.participants[(index + 1) % session.participants.length];
}

function checkStopConditions(session, requested_stop) {
  // 1. Explicit stop request
  if (requested_stop) {
    return { should_stop: true, reason: 'STOP_REQUESTED' };
  }

  // 2. Goal complete (100% progress)
  if (session.progress >= 100) {
    return { should_stop: true, reason: 'GOAL_COMPLETE' };
  }

  // 3. Max turns reached
  if (session.turns.length >= session.max_turns) {
    return { should_stop: true, reason: 'MAX_TURNS_REACHED' };
  }

  // 4. Timeout
  const elapsed = Date.now() - session.started_at_timestamp;
  const timeout = session.timeout_minutes * 60 * 1000;
  if (elapsed > timeout) {
    return { should_stop: true, reason: 'TIMEOUT' };
  }

  // 5. Deadlock detection (3 turns without progress)
  if (session.turns.length >= 3) {
    const recentTurns = session.turns.slice(-3);
    const progressChanged = recentTurns.some((turn, i) => {
      if (i === 0) return false;
      const prevProgress = session.turns[session.turns.length - 3 + i - 1].state_analysis?.gap_to_goal?.progress || 0;
      const currentProgress = turn.state_analysis?.gap_to_goal?.progress || 0;
      return currentProgress > prevProgress;
    });

    if (!progressChanged) {
      return { should_stop: true, reason: 'DEADLOCK_DETECTED' };
    }
  }

  return { should_stop: false, reason: null };
}

export default router;
