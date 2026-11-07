import { useEffect, useRef, useState } from "react";
import { loadModel, predict } from "./attentionModel.js";
import { createFaceTracker } from "./faceTracker.js";

const TICK_MS = 100; // 10 frames a second, the rate the model was trained on
const WINDOW_FRAMES = 100;
const FRAME_SIZE = 478 * 3;
const NO_FACE_TICKS = 10; // one second without a face
const TICKS_BETWEEN_PREDICTIONS = 20; // a score every 2 seconds

export function useAttention({ videoRef, enabled, onScore }) {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [lastScore, setLastScore] = useState(null);
  const [error, setError] = useState(null);

  // onScore changes on every render; the loop must not restart because of it.
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setProgress(0);
      return undefined;
    }

    let stopped = false;
    let timer = null;
    let tracker = null;

    const buffer = new Float32Array(WINDOW_FRAMES * FRAME_SIZE);
    let writeIndex = 0;
    let count = 0;
    let missedTicks = 0;
    let ticksSincePrediction = 0;
    let busy = false;

    // The ring buffer in time order: oldest frame first.
    function chronologicalWindow() {
      const copy = new Float32Array(buffer.length);
      const split = writeIndex * FRAME_SIZE;
      copy.set(buffer.subarray(split));
      copy.set(buffer.subarray(0, split), buffer.length - split);
      return copy;
    }

    async function runPrediction() {
      busy = true;
      try {
        const { score, raw } = await predict(chronologicalWindow());
        if (stopped) return;
        setLastScore(score);
        setStatus((current) => (current === "no_face" ? current : "measuring"));
        onScoreRef.current?.(score, raw);
      } catch (cause) {
        console.error(cause);
      } finally {
        busy = false;
      }
    }

    function tick() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      let frame = null;
      try {
        frame = tracker.detect(video, performance.now());
      } catch (cause) {
        console.error(cause);
      }

      if (!frame) {
        missedTicks += 1;
        if (missedTicks >= NO_FACE_TICKS) {
          // The window must hold only consecutive frames, so it starts over.
          count = 0;
          writeIndex = 0;
          ticksSincePrediction = 0;
          setProgress(0);
          setStatus("no_face");
        }
        return;
      }

      missedTicks = 0;
      buffer.set(frame, writeIndex * FRAME_SIZE);
      writeIndex = (writeIndex + 1) % WINDOW_FRAMES;

      if (count < WINDOW_FRAMES) {
        count += 1;
        setProgress(count / WINDOW_FRAMES);
        if (count < WINDOW_FRAMES) {
          setStatus("collecting");
          return;
        }
        ticksSincePrediction = TICKS_BETWEEN_PREDICTIONS; // first score as soon as the window is full
      } else {
        setStatus((current) => (current === "no_face" ? "collecting" : current));
        ticksSincePrediction += 1;
      }

      if (ticksSincePrediction >= TICKS_BETWEEN_PREDICTIONS && !busy) {
        ticksSincePrediction = 0;
        runPrediction();
      }
    }

    setStatus("loading");
    setError(null);
    setLastScore(null);
    setProgress(0);

    Promise.all([createFaceTracker(), loadModel()])
      .then(([createdTracker]) => {
        if (stopped) {
          createdTracker.close();
          return;
        }
        tracker = createdTracker;
        setStatus("collecting");
        timer = setInterval(tick, TICK_MS);
      })
      .catch((cause) => {
        console.error(cause);
        if (stopped) return;
        setError("לא הצלחנו לטעון את מודל הקשב. רעננו את הדף ונסו שוב.");
        setStatus("error");
      });

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      tracker?.close();
    };
  }, [enabled, videoRef]);

  return { status, progress, lastScore, error };
}
