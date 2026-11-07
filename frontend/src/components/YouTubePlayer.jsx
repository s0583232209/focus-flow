import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const API_SRC = "https://www.youtube.com/iframe_api";
const API_TIMEOUT_MS = 15_000;
const READY_TIMEOUT_MS = 20_000;

let apiPromise = null;

// The API script is loaded once, however many players the user opens.
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const fail = () => {
      apiPromise = null;
      reject(new Error("YouTube API failed to load"));
    };
    const timer = setTimeout(fail, API_TIMEOUT_MS);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      previous?.();
      resolve(window.YT);
    };
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = API_SRC;
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        fail();
      };
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

const YouTubePlayer = forwardRef(function YouTubePlayer({ videoId }, ref) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [state, setState] = useState("loading"); // loading | ready | error

  useImperativeHandle(
    ref,
    () => ({
      getPosition() {
        const player = playerRef.current;
        if (!player?.getCurrentTime) return 0;
        return Math.round(player.getCurrentTime() * 10) / 10;
      },
      seekBy(seconds) {
        const player = playerRef.current;
        if (!player?.seekTo) return;
        player.seekTo(Math.max(0, player.getCurrentTime() + seconds), true);
      },
    }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    // The API can load while the iframe itself is blocked by a network filter or an
    // extension; onReady then never fires, so the "loading" text must not stay forever.
    const readyTimer = setTimeout(() => {
      if (!cancelled) setState("error");
    }, READY_TIMEOUT_MS);
    // YT.Player replaces the element it gets, so React keeps only the parent.
    const target = document.createElement("div");
    hostRef.current.appendChild(target);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(target, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
          events: {
            onReady: () => {
              clearTimeout(readyTimer);
              if (!cancelled) setState("ready");
            },
          },
        });
      })
      .catch(() => {
        clearTimeout(readyTimer);
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
      clearTimeout(readyTimer);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      target.remove();
    };
  }, [videoId]);

  return (
    <div className="video-frame">
      <div ref={hostRef} className="video-host" />
      {state === "loading" && <p className="video-message">טוען את הסרטון...</p>}
      {state === "error" && (
        <p className="video-message" role="alert">
          לא ניתן לטעון את הנגן. בדקו את החיבור לאינטרנט.
        </p>
      )}
    </div>
  );
});

export default YouTubePlayer;
