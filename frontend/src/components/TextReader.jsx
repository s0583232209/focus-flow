import { forwardRef, useImperativeHandle, useRef, useState } from "react";

function scrollPercent(element) {
  if (!element) return 0;
  const range = element.scrollHeight - element.clientHeight;
  if (range <= 0) return 0;
  return Math.round((element.scrollTop / range) * 1000) / 10;
}

const TextReader = forwardRef(function TextReader({ text }, ref) {
  const panelRef = useRef(null);
  const [percent, setPercent] = useState(0);

  useImperativeHandle(
    ref,
    () => ({
      getPosition: () => scrollPercent(panelRef.current),
      seekBy(seconds) {
        const panel = panelRef.current;
        if (panel && seconds < 0) panel.scrollBy({ top: -panel.clientHeight, behavior: "smooth" });
      },
    }),
    [],
  );

  const paragraphs = text.split(/\n\s*\n/).filter((part) => part.trim());

  return (
    <div className="text-reader">
      <div className="reading-progress">
        <div className="reading-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      {/* tabIndex: the panel can be scrolled from the keyboard */}
      <div
        ref={panelRef}
        className="text-panel"
        tabIndex={0}
        onScroll={() => setPercent(scrollPercent(panelRef.current))}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
});

export default TextReader;
