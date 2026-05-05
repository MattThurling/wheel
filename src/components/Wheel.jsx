import { Drum, Guitar, KeyboardMusic } from "lucide-react";
import { useEffect, useRef } from "react";

const innerCircles = [
  {
    className: "wheel__inner-orbit wheel__inner-orbit--one",
    Icon: KeyboardMusic,
    showTicks: true
  },
  {
    className: "wheel__inner-orbit wheel__inner-orbit--two",
    Icon: Guitar,
    showTicks: true
  },
  {
    className: "wheel__inner-orbit wheel__inner-orbit--three",
    Icon: Drum,
    showTicks: true
  }
];

export default function Wheel({
  isPlaying,
  onTogglePlay,
  tickDuration,
  playDuration,
  beatsPerBar,
  playClockwise,
  dayMode
}) {
  const wheelShellRef = useRef(null);
  const tickAngles = Array.from(
    { length: beatsPerBar },
    (_, index) => (index * 360) / beatsPerBar
  );
  const playButtonRef = useRef(null);
  const wheelAngleRef = useRef(0);
  const playAngleRef = useRef(0);
  const lastWheelFrameRef = useRef(null);
  const lastFrameRef = useRef(null);

  useEffect(() => {
    if (!wheelShellRef.current) {
      return undefined;
    }

    wheelShellRef.current.style.setProperty(
      "--wheel-angle",
      `${wheelAngleRef.current}deg`
    );

    if (!isPlaying) {
      lastWheelFrameRef.current = null;
      return undefined;
    }

    let frameId = 0;

    const step = (timestamp) => {
      if (lastWheelFrameRef.current == null) {
        lastWheelFrameRef.current = timestamp;
      }

      const delta = timestamp - lastWheelFrameRef.current;
      lastWheelFrameRef.current = timestamp;

      wheelAngleRef.current =
        (wheelAngleRef.current + (delta * 360) / (tickDuration * 1000)) % 360;

      wheelShellRef.current?.style.setProperty(
        "--wheel-angle",
        `${wheelAngleRef.current}deg`
      );

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
      lastWheelFrameRef.current = null;
    };
  }, [isPlaying, tickDuration]);

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

  const renderTicks = (className) =>
    tickAngles.map((angle) => (
      <line
        key={`${className}-${angle}`}
        className={className}
        x1="50"
        y1="5.4"
        x2="50"
        y2="8.5"
        transform={`rotate(${angle} 50 50)`}
      />
    ));

  const renderInnerTicks = () =>
    Array.from({ length: 12 }, (_, index) => index * 30).map((angle) => (
      <line
        key={`inner-tick-${angle}`}
        className="wheel__inner-mini-tick"
        x1="50"
        y1="1.75"
        x2="50"
        y2="5.75"
        transform={`rotate(${angle} 50 50)`}
      />
    ));

  return (
    <div
      ref={wheelShellRef}
      className="wheel-shell"
      style={{
        "--wheel-angle": "0deg",
        "--wheel-spin-duration": `${tickDuration}s`,
        "--play-spin-duration": `${playDuration}s`,
        "--wheel-play-state": isPlaying ? "running" : "paused",
        "--wheel-highlight-opacity": isPlaying ? 1 : 0,
        "--wheel-spin-direction": "normal",
        "--play-spin-direction": playClockwise ? "normal" : "reverse",
        "--wheel-border-color": dayMode ? "rgb(188 188 188)" : "rgb(120 120 128)",
        "--wheel-tick-color": dayMode ? "rgb(228 228 228)" : "rgb(48 48 52)",
        "--wheel-highlight-color": dayMode ? "rgb(0 0 0)" : "rgb(255 255 255)",
        "--wheel-inner-icon-color": dayMode ? "rgb(84 84 84)" : "rgb(224 224 228)",
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
          {renderTicks("wheel__svg-tick")}
        </svg>

        <div className="wheel__inner-circles">
          {innerCircles.map(({ className, Icon, showTicks }) => (
            <span key={className} className={className}>
              <span className="wheel__inner-circle-shell">
                <span className="wheel__inner-circle">
                  {showTicks ? (
                    <svg
                      className="wheel__inner-mini-ticks"
                      viewBox="0 0 100 100"
                      aria-hidden="true"
                      focusable="false"
                    >
                      {renderInnerTicks()}
                    </svg>
                  ) : null}
                  <Icon
                    size={22}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="wheel__inner-icon"
                  />
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="wheel__highlight-window" aria-hidden="true">
        <div className="wheel__highlight-rotor">
          <svg
            className="wheel__svg"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            {renderTicks("wheel__svg-tick wheel__svg-tick--highlight")}
          </svg>
        </div>
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
