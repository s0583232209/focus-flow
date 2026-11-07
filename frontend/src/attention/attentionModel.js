import * as ort from "onnxruntime-web/wasm";

ort.env.wasm.wasmPaths = "/ort/";
// One thread needs no COOP/COEP headers, and those headers would break the YouTube player.
ort.env.wasm.numThreads = 1;

let sessionPromise = null;

// Loaded once and shared by everything on the page.
export function loadModel(url = "/models/v4_2.onnx") {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(url, { executionProviders: ["wasm"] })
      .then((session) => {
        if (import.meta.env.DEV) {
          console.info("attention model", session.inputNames, session.outputNames);
        }
        return session;
      })
      .catch((error) => {
        sessionPromise = null; // allow another try
        throw error;
      });
  }
  return sessionPromise;
}

// frames: Float32Array(100 * 478 * 3), oldest frame first.
export async function predict(frames) {
  const session = await loadModel();
  const input = new ort.Tensor("float32", frames, [1, 100, 478, 3]);
  const raw = await session.run({ [session.inputNames[0]]: input });
  const value = raw[session.outputNames[0]].data[0];
  return { score: Math.min(1, Math.max(0, Number(value))), raw };
}
