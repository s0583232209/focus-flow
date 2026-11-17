// זיהוי נקודות פנים בעזרת MediaPipe Face Landmarker, בתוך הדפדפן.
// הווידאו והנקודות לא יוצאים מהמחשב – רק הציון נשלח לשרת.
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"; // ספריית MediaPipe

const NUM_LANDMARKS = 478; // מספר הנקודות ש-MediaPipe מחזיר לפנים אחת (והמודל שלנו מצפה בדיוק לזה)

// יוצר את הגלאי. delegate = על מה לרוץ: "GPU" (כרטיס מסך, מהיר) או "CPU"
async function createLandmarker(vision, delegate) {
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate }, // קובץ המודל מתוך האתר שלנו
    runningMode: "VIDEO", // מצב וידאו: עוקב בין פריימים ומהיר יותר מתמונות בודדות
    numFaces: 1, // מחפשים פנים אחת בלבד
  });
}

export async function createFaceTracker() {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm"); // טעינת קבצי ה-wasm של MediaPipe (מקומיים)
  let landmarker;
  try {
    landmarker = await createLandmarker(vision, "GPU"); // קודם מנסים על כרטיס המסך
  } catch {
    landmarker = await createLandmarker(vision, "CPU"); // אם לא נתמך – על המעבד
  }

  return { // האובייקט שהמשתמש בקובץ מקבל
    // מחזירה את x,y,z הגולמיים של כל 478 הנקודות לפי הסדר, בלי נרמול
    // (המודל מנרמל בעצמו), או null כשאין פנים שלמות בפריים
    detect(video, timestampMs) {
      const face = landmarker.detectForVideo(video, timestampMs).faceLandmarks?.[0]; // הפנים הראשונות (אם יש)
      if (!face || face.length !== NUM_LANDMARKS) return null; // אין פנים או מספר נקודות שגוי
      const points = new Float32Array(NUM_LANDMARKS * 3); // מערך מספרים שטוח: x0,y0,z0,x1,y1,z1,...
      for (let i = 0; i < NUM_LANDMARKS; i += 1) {
        points[i * 3] = face[i].x; // x של נקודה i
        points[i * 3 + 1] = face[i].y; // y
        points[i * 3 + 2] = face[i].z; // z (עומק)
      }
      return points;
    },
    close() {
      landmarker.close(); // שחרור הזיכרון של הגלאי
    },
  };
}
