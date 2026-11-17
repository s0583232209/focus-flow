// הגדרות Vite – הכלי שמריץ את שרת הפיתוח (npm run dev) ובונה את האתר (npm run build).
import { defineConfig } from "vite"; // עוזר להגדרות (השלמה אוטומטית בעורך)
import react from "@vitejs/plugin-react"; // תמיכה ב-JSX וב-React
import { viteStaticCopy } from "vite-plugin-static-copy"; // מעתיק קבצים כמו שהם לתיקיית הבנייה

export default defineConfig({
  plugins: [
    react(),
    // קבצי MediaPipe ו-ONNX Runtime מוגשים מהאתר שלנו: שום דבר לא מורד מהאינטרנט בזמן ריצה
    viteStaticCopy({
      targets: [
        // קבצי ה-wasm של MediaPipe → dist/mediapipe/wasm. stripBase – בלי מבנה התיקיות המקורי
        { src: "node_modules/@mediapipe/tasks-vision/wasm/*", dest: "mediapipe/wasm", rename: { stripBase: true } },
        // קבצי ה-wasm/mjs של onnxruntime → dist/ort (שם attentionModel.js מחפש אותם)
        { src: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{wasm,mjs}", dest: "ort", rename: { stripBase: true } },
      ],
    }),
  ],
});
