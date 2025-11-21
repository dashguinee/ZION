/**
 * State Analyzer
 * Analyzes collaboration state, calculates gaps, and tracks progress
 */

export class StateAnalyzer {
  /**
   * Merge two states together
   * Later state takes precedence for conflicts
   */
  mergeStates(oldState, newState) {
    return {
      completed: [...new Set([
        ...(oldState.completed || []),
        ...(newState.completed || [])
      ])],

      in_progress: newState.in_progress || oldState.in_progress || [],

      not_started: (newState.not_started || oldState.not_started || [])
        .filter(item => !(newState.completed || []).includes(item)),

      artifacts: [
        ...(oldState.artifacts || []),
        ...(newState.artifacts || [])
      ],

      metrics: {
        ...(oldState.metrics || {}),
        ...(newState.metrics || {})
      }
    };
  }

  /**
   * Calculate delta between two states
   */
  calculateDelta(oldState, newState) {
    const oldCompleted = new Set(oldState.completed || []);
    const newCompleted = new Set(newState.completed || []);

    const added = [...newCompleted].filter(x => !oldCompleted.has(x));
    const removed = [...oldCompleted].filter(x => !newCompleted.has(x));

    const oldArtifacts = oldState.artifacts || [];
    const newArtifacts = newState.artifacts || [];
    const artifactsAdded = newArtifacts.length - oldArtifacts.length;

    return {
      added,
      removed,
      artifacts_added: artifactsAdded,
      progress_made: (newState.progress || 0) - (oldState.progress || 0)
    };
  }

  /**
   * Analyze gap to goal
   */
  analyzeGap(currentState, goal, turns) {
    const totalItems =
      (currentState.completed || []).length +
      (currentState.in_progress || []).length +
      (currentState.not_started || []).length;

    const completedItems = (currentState.completed || []).length;

    // Calculate progress percentage
    let progress = 0;
    if (totalItems > 0) {
      progress = Math.round((completedItems / totalItems) * 100);
    }

    // Estimate remaining turns
    let estimatedTurnsRemaining = 'unknown';
    if (turns.length >= 2) {
      const progressPerTurn = progress / turns.length;
      if (progressPerTurn > 0) {
        estimatedTurnsRemaining = Math.ceil((100 - progress) / progressPerTurn);
      }
    }

    // Identify blockers
    const blockers = this.identifyBlockers(currentState, turns);

    return {
      goal,
      current_progress: progress,
      remaining_work: currentState.not_started || [],
      ongoing_work: currentState.in_progress || [],
      completed_work: currentState.completed || [],
      estimated_turns_remaining: estimatedTurnsRemaining,
      blockers,
      confidence: this.calculateConfidence(currentState, turns)
    };
  }

  /**
   * Identify potential blockers
   */
  identifyBlockers(state, turns) {
    const blockers = [];

    // Check for stalled in_progress items
    if (turns.length >= 3) {
      const recentInProgress = turns.slice(-3).map(t =>
        t.state_analysis?.current_state?.in_progress || []
      );

      // Find items that have been in_progress for 3+ turns
      const stalledItems = recentInProgress[0].filter(item =>
        recentInProgress.every(ip => ip.includes(item))
      );

      stalledItems.forEach(item => {
        blockers.push({
          type: 'stalled_task',
          item: item,
          description: `${item} has been in progress for 3+ turns`
        });
      });
    }

    // Check for missing dependencies (items in not_started with no clear path)
    // This is heuristic-based

    return blockers;
  }

  /**
   * Calculate confidence in current approach
   */
  calculateConfidence(state, turns) {
    let confidence = 0.5; // Neutral start

    // Higher confidence if making steady progress
    if (turns.length >= 2) {
      const lastTwoProgress = turns.slice(-2).map(t =>
        t.state_analysis?.gap_to_goal?.current_progress || 0
      );

      if (lastTwoProgress[1] > lastTwoProgress[0]) {
        confidence += 0.2;
      }
    }

    // Higher confidence if no blockers
    const blockers = this.identifyBlockers(state, turns);
    if (blockers.length === 0) {
      confidence += 0.15;
    }

    // Higher confidence if artifacts are being created
    if ((state.artifacts || []).length > 0) {
      confidence += 0.15;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate state analysis for a turn
   */
  generateAnalysis(session, newState) {
    const pastState = session.current_state;
    const delta = this.calculateDelta(pastState, newState);
    const gap = this.analyzeGap(newState, session.goal, session.turns);

    return {
      past_state: pastState,
      current_state: newState,
      delta: delta,
      gap_to_goal: gap
    };
  }
}
