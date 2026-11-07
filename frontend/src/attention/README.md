# Attention measurement in the browser

Data flow: camera → `<video>` → MediaPipe Face Landmarker (10 times a second) → sliding window of 100 frames → ONNX model (every 2 seconds) → score from 0 to 1.

Only the score and the position in the content go to the server. The video and the face points never leave the browser.

**Shapes.** One frame is 478 points × 3 (x, y, z) = 1434 numbers. The model input is `[1, 100, 478, 3]`, oldest frame first. The first output is the score.

**Raw points.** `faceTracker.detect` returns MediaPipe's points as they are. The model normalizes by itself, so any extra processing would change the score. If there are not exactly 478 points, it returns `null`.

**Why `numThreads = 1`.** Threads in WebAssembly need COOP/COEP headers, and those headers would break the YouTube player iframe.

**Why the files are local.** The wasm files come from `node_modules` (copied by `vite-plugin-static-copy` to `/mediapipe/wasm` and `/ort`) and the models are in `public/models`. All of them end up inside the image, because the brief forbids downloading them at runtime.
