import { useCallback, useEffect, useState } from "react";
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

export function useProjectProgress(projectId) {
  const [steps, setSteps] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [overallPercent, setOverallPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!projectId) {
      setSteps([]);
      setUpdates([]);
      setOverallPercent(0);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await progressService.getProgress(projectId);
      setSteps(result.steps);
      setUpdates(result.updates);
      setOverallPercent(result.overallPercent);
      return result;
    } catch (err) {
      setSteps(FALLBACK_PROGRESS.steps);
      setUpdates(FALLBACK_PROGRESS.updates);
      setOverallPercent(FALLBACK_PROGRESS.overallPercent);
      setError(null);
      return {
        ...FALLBACK_PROGRESS,
        projectId,
        error: err,
      };
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

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
