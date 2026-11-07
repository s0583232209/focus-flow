import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const NUM_LANDMARKS = 478;

async function createLandmarker(vision, delegate) {
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate },
    runningMode: "VIDEO",
    numFaces: 1,
  });
}

export async function createFaceTracker() {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  let landmarker;
  try {
    landmarker = await createLandmarker(vision, "GPU");
  } catch {
    landmarker = await createLandmarker(vision, "CPU");
  }

  return {
    // Returns the raw x,y,z of all 478 points in landmark order, with no normalization
    // (the model normalizes by itself), or null when there is no complete face.
    detect(video, timestampMs) {
      const face = landmarker.detectForVideo(video, timestampMs).faceLandmarks?.[0];
      if (!face || face.length !== NUM_LANDMARKS) return null;
      const points = new Float32Array(NUM_LANDMARKS * 3);
      for (let i = 0; i < NUM_LANDMARKS; i += 1) {
        points[i * 3] = face[i].x;
        points[i * 3 + 1] = face[i].y;
        points[i * 3 + 2] = face[i].z;
      }
      return points;
    },
    close() {
      landmarker.close();
    },
  };
}
