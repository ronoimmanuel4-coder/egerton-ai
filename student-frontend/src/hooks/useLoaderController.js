import { useEffect, useRef, useState } from 'react';

const LOG_INTERVAL_MS = 500;

export default function useLoaderController({
  progress,
  minDuration = 5000,
  maxDuration = 10000,
  dissolveDuration = 1500,
  threshold = 99.5,
  enableLogging = false,
  logLabel = 'Loader',
  onExitStart,
  onComplete,
}) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [canExit, setCanExit] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  const startTimeRef = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);
  const dissolveTimerRef = useRef(null);
  const hasExitStartedRef = useRef(false);
  const lastLogRef = useRef(0);

  // Smooth displayed progress to respect minimum duration
  useEffect(() => {
    const update = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = now - startTimeRef.current;
      const forcedProgress = Math.min(100, (elapsed / minDuration) * 100);
      const actualProgress = Number.isFinite(progress) ? progress : 0;
      const target = Math.min(actualProgress, forcedProgress);

      setDisplayProgress((prev) => (target > prev ? target : prev));

      if (enableLogging && (now - lastLogRef.current >= LOG_INTERVAL_MS || target === 100)) {
        // eslint-disable-next-line no-console
        console.debug(
          `[${logLabel}] progress | actual: ${actualProgress.toFixed(1)} forced: ${forcedProgress.toFixed(1)} display: ${target.toFixed(1)} elapsed: ${(elapsed / 1000).toFixed(1)}s`
        );
        lastLogRef.current = now;
      }

      if (forcedProgress < 100 || actualProgress < 100) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [progress, minDuration, enableLogging, logLabel]);

  // Allow exit once both real and forced progress complete
  useEffect(() => {
    if (!canExit && progress >= 100 && displayProgress >= threshold) {
      setCanExit(true);
    }
  }, [progress, displayProgress, threshold, canExit]);

  // Force exit if max duration exceeded
  useEffect(() => {
    if (canExit) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return undefined;
    }

    timeoutRef.current = setTimeout(() => {
      if (enableLogging) {
        // eslint-disable-next-line no-console
        console.warn(`[${logLabel}] forcing exit after ${maxDuration}ms`);
      }
      setDisplayProgress(100);
      setCanExit(true);
    }, maxDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [canExit, maxDuration, enableLogging, logLabel]);

  // Trigger dissolve phase once exit is allowed
  useEffect(() => {
    if (canExit && !hasExitStartedRef.current) {
      hasExitStartedRef.current = true;
      onExitStart?.();
      setDissolving(true);
    }
  }, [canExit, onExitStart]);

  // Complete dissolve after specified duration
  useEffect(() => {
    if (!dissolving) {
      if (dissolveTimerRef.current) {
        clearTimeout(dissolveTimerRef.current);
        dissolveTimerRef.current = null;
      }
      return undefined;
    }

    dissolveTimerRef.current = setTimeout(() => {
      onComplete?.();
    }, dissolveDuration);

    return () => {
      if (dissolveTimerRef.current) {
        clearTimeout(dissolveTimerRef.current);
        dissolveTimerRef.current = null;
      }
    };
  }, [dissolving, dissolveDuration, onComplete]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (dissolveTimerRef.current) {
      clearTimeout(dissolveTimerRef.current);
      dissolveTimerRef.current = null;
    }
  }, []);

  return { displayProgress, canExit, dissolving };
}
