import { useEffect, useRef } from "react";

export default function Wheel({
  isPlaying,
  onTogglePlay,
  tickDuration,
  playDuration,
  beatsPerBar,
  playClockwise,
  dayMode
}) {
  const tickAngles = Array.from(
    { length: beatsPerBar },
    (_, index) => (index * 360) / beatsPerBar
  );
  const playButtonRef = useRef(null);
  const playAngleRef = useRef(0);
  const lastFrameRef = useRef(null);

  useEffect(() => {
    if (!playButtonRef.current) {
      return undefined;
    }

    playButtonRef.current.style.setProperty(
      "--play-angle",
      `${playAngleRef.current}deg`
    );

    if (!isPlaying) {
      lastFrameRef.current = null;
      return undefined;
    }

    const direction = playClockwise ? -1 : 1;
    let frameId = 0;

    const step = (timestamp) => {
      if (lastFrameRef.current == null) {
        lastFrameRef.current = timestamp;
      }

      const delta = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      playAngleRef.current =
        (playAngleRef.current +
          direction * ((delta * 360) / (playDuration * 1000))) %
        360;

      playButtonRef.current?.style.setProperty(
        "--play-angle",
        `${playAngleRef.current}deg`
      );

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
      lastFrameRef.current = null;
    };
  }, [isPlaying, playClockwise, playDuration]);

  return (
    <div
      className="wheel-shell"
      style={{
        "--wheel-spin-duration": `${tickDuration}s`,
        "--play-spin-duration": `${playDuration}s`,
        "--wheel-play-state": isPlaying ? "running" : "paused",
        "--wheel-spin-direction": "normal",
        "--play-spin-direction": playClockwise ? "normal" : "reverse",
        "--wheel-border-color": dayMode ? "rgb(188 188 188)" : "rgb(120 120 128)",
        "--wheel-tick-color": dayMode ? "rgb(228 228 228)" : "rgb(48 48 52)",
        "--wheel-lead-tick-color": dayMode ? "rgb(0 0 0)" : "rgb(255 255 255)",
        "--wheel-play-color": dayMode ? "rgb(122 122 122)" : "rgb(245 245 245)"
      }}
    >
      <div className="wheel__rotor" aria-hidden="true">
        <svg
          className="wheel__svg"
          viewBox="0 0 100 100"
          aria-hidden="true"
          focusable="false"
        >
          <circle className="wheel__svg-ring" cx="50" cy="50" r="48.5" />

          {tickAngles.map((angle) => (
            <line
              key={angle}
              className={`wheel__svg-tick ${
                angle === 0 ? "wheel__svg-tick--lead" : ""
              }`}
              x1="50"
              y1="9.5"
              x2="50"
              y2="12.5"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </svg>
      </div>

      <button
        ref={playButtonRef}
        className="wheel__play"
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Stop rotation" : "Start rotation"}
        aria-pressed={isPlaying}
      >
        <span className="wheel__play-icon" aria-hidden="true" />
      </button>
    </div>
  );
}
