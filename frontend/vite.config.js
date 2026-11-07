import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    // The MediaPipe and ONNX Runtime files are served by us: nothing downloads at runtime.
    viteStaticCopy({
      targets: [
        { src: "node_modules/@mediapipe/tasks-vision/wasm/*", dest: "mediapipe/wasm", rename: { stripBase: true } },
        { src: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{wasm,mjs}", dest: "ort", rename: { stripBase: true } },
      ],
    }),
  ],
});
