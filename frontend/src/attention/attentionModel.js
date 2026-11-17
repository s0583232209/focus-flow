// מודל הקשב (קובץ ONNX) שרץ בתוך הדפדפן בעזרת onnxruntime-web.
// מקבל 100 פריימים של נקודות פנים ומחזיר ציון קשב בין 0 ל-1.
import * as ort from "onnxruntime-web/wasm"; // הגרסה שרצה על WebAssembly (מהירה, בלי שרת)

ort.env.wasm.wasmPaths = "/ort/"; // מאיפה לטעון את קבצי ה-wasm – מתוך האתר שלנו, לא מהאינטרנט
// תהליכון אחד לא דורש כותרות COOP/COEP, וכותרות כאלה היו שוברות את נגן YouTube
ort.env.wasm.numThreads = 1;

let sessionPromise = null; // המודל הטעון (כ-Promise), משותף לכל הדף

// נטען פעם אחת ומשותף לכל מי שצריך אותו
export function loadModel(url = "/models/v1.onnx") {
  if (!sessionPromise) { // רק אם עוד לא התחלנו לטעון
    sessionPromise = ort.InferenceSession.create(url, { executionProviders: ["wasm"] }) // טעינת המודל
      .then((session) => {
        return session;
      })
      .catch((error) => {
        sessionPromise = null; // מאפשרים ניסיון נוסף
        throw error;
      });
  }
  return sessionPromise;
}

// frames: מערך של 100 * 478 * 3 מספרים (100 פריימים × 478 נקודות × x,y,z), הפריים הישן ראשון
export async function predict(frames) {
  const session = await loadModel(); // מוודאים שהמודל טעון
  const input = new ort.Tensor("float32", frames, [1, 100, 478, 3]); // טנזור = מערך רב-ממדי בצורה שהמודל מצפה לה
  const raw = await session.run({ [session.inputNames[0]]: input }); // הרצת המודל; שם הקלט נלקח מהמודל עצמו
  const value = raw[session.outputNames[0]].data[0]; // המספר הראשון בפלט הראשון = הציון
  return { score: Math.min(1, Math.max(0, Number(value))), raw }; // מגבילים לטווח 0..1, ומחזירים גם את הפלט הגולמי
}
