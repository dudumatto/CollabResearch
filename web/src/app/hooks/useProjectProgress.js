import { useCallback, useEffect, useRef, useState } from "react";
import { progressService } from "../services/progressService";

const FALLBACK_PROGRESS = {
  steps: [],
  updates: [],
  overallPercent: 0,
};

function normalizeStepsAfterAdvance(steps, stepId) {
  const nextSteps = steps.map((step) =>
    String(step.id) === String(stepId)
      ? { ...step, status: "DONE", completedAt: step.completedAt ?? new Date().toISOString() }
      : { ...step },
  );

  let foundActive = false;
  for (const step of nextSteps) {
    if (step.status === "DONE" || step.status === "REJECTED") {
      continue;
    }

    if (!foundActive) {
      step.status = "ACTIVE";
      foundActive = true;
    } else {
      step.status = "PENDING";
    }
  }

  return nextSteps;
}

function projectKey(projectId) {
  return projectId == null ? "" : String(projectId);
}

export function useProjectProgress(projectId, options = {}) {
  const { initialProgress = null } = options;
  const hydratedInitialProjectRef = useRef(null);
  const [steps, setSteps] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [overallPercent, setOverallPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyProgress = useCallback((result) => {
    setSteps(Array.isArray(result?.steps) ? result.steps : FALLBACK_PROGRESS.steps);
    setUpdates(Array.isArray(result?.updates) ? result.updates : FALLBACK_PROGRESS.updates);
    setOverallPercent(Number(result?.overallPercent ?? FALLBACK_PROGRESS.overallPercent));
  }, []);

  const resetProgress = useCallback(() => {
    setSteps(FALLBACK_PROGRESS.steps);
    setUpdates(FALLBACK_PROGRESS.updates);
    setOverallPercent(FALLBACK_PROGRESS.overallPercent);
    setError(null);
    setIsLoading(false);
  }, []);

  const reload = useCallback(async () => {
    if (!projectId) {
      resetProgress();
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await progressService.getProgress(projectId);
      applyProgress(result);
      return result;
    } catch (err) {
      resetProgress();
      setError(null);
      return {
        ...FALLBACK_PROGRESS,
        projectId,
        error: err,
      };
    } finally {
      setIsLoading(false);
    }
  }, [applyProgress, projectId, resetProgress]);

  useEffect(() => {
    const currentProjectKey = projectKey(projectId);
    if (!currentProjectKey) {
      resetProgress();
      return;
    }

    const initialProjectKey = projectKey(initialProgress?.projectId);
    if (
      initialProjectKey === currentProjectKey &&
      hydratedInitialProjectRef.current !== currentProjectKey
    ) {
      hydratedInitialProjectRef.current = currentProjectKey;
      applyProgress(initialProgress);
      setError(null);
      setIsLoading(false);
      return;
    }

    reload().catch(() => {});
  }, [applyProgress, initialProgress, projectId, reload, resetProgress]);

  const advanceStep = useCallback(
    async (stepId) => {
      if (!projectId) return null;

      const response = await progressService.advanceStep(projectId, stepId, { status: "done" });
      setSteps((currentSteps) => normalizeStepsAfterAdvance(currentSteps, stepId));
      if (typeof response.overallPercent === "number") {
        setOverallPercent(response.overallPercent);
      }
      return response;
    },
    [projectId],
  );

  const createUpdate = useCallback(
    async (payload) => {
      if (!projectId) return null;

      const created = await progressService.createUpdate(projectId, payload);
      setUpdates((currentUpdates) => [created, ...currentUpdates]);
      return created;
    },
    [projectId],
  );

  return {
    steps,
    updates,
    overallPercent,
    isLoading,
    error,
    reload,
    advanceStep,
    createUpdate,
  };
}
