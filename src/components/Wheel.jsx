import { Drum, Guitar, KeyboardMusic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const innerCircles = [
  {
    className: "wheel__inner-orbit wheel__inner-orbit--one",
    Icon: KeyboardMusic,
    markerMode: "ticks"
  },
  {
    className: "wheel__inner-orbit wheel__inner-orbit--two",
    Icon: Guitar,
    markerMode: "ticks"
  },
  {
    className: "wheel__inner-orbit wheel__inner-orbit--three",
    Icon: Drum,
    markerMode: "sequence"
  }
];

const drumSparseSequence = [0, 6];
const drumSequence = [0, 3, 6, 9];
const drumAlternateSequence = [0, 2, 4, 6, 8, 10];
const drumTrackConfigs = {
  A: {
    sequence: drumSparseSequence,
    outerBeatsPerAdvance: 2
  },
  B: {
    sequence: drumSequence,
    outerBeatsPerAdvance: 1
  },
  D: {
    sequence: drumAlternateSequence,
    outerBeatsPerAdvance: 0.5
  }
};

export default function Wheel({
  isPlaying,
  onTogglePlay,
  resetToken,
  selectedTrack,
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
  const innerMarkerAngles = Array.from({ length: 12 }, (_, index) => index * 30);
  const drumTrackConfig = drumTrackConfigs[selectedTrack] ?? drumTrackConfigs.B;
  const activeDrumSequence = drumTrackConfig.sequence;
  const drumAdvanceBeatSpan = drumTrackConfig.outerBeatsPerAdvance;
  const playButtonRef = useRef(null);
  const wheelAngleRef = useRef(0);
  const playAngleRef = useRef(0);
  const drumSequenceIndexRef = useRef(0);
  const beatAccumulatorRef = useRef(0);
  const lastWheelFrameRef = useRef(null);
  const lastFrameRef = useRef(null);
  const [activeDrumMarkerIndex, setActiveDrumMarkerIndex] = useState(
    activeDrumSequence[0]
  );

  useEffect(() => {
    wheelAngleRef.current = 0;
    playAngleRef.current = 0;
    drumSequenceIndexRef.current = 0;
    beatAccumulatorRef.current = 0;
    lastWheelFrameRef.current = null;
    lastFrameRef.current = null;

    wheelShellRef.current?.style.setProperty("--wheel-angle", "0deg");
    playButtonRef.current?.style.setProperty("--play-angle", "0deg");
    setActiveDrumMarkerIndex(activeDrumSequence[0]);
  }, [activeDrumSequence, resetToken]);

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

      beatAccumulatorRef.current += delta;
      const beatDuration =
        ((tickDuration * 1000) / beatsPerBar) * drumAdvanceBeatSpan;
      let nextSequenceIndex = drumSequenceIndexRef.current;
      let advanced = false;

      while (beatAccumulatorRef.current >= beatDuration) {
        beatAccumulatorRef.current -= beatDuration;
        nextSequenceIndex = (nextSequenceIndex + 1) % activeDrumSequence.length;
        advanced = true;
      }

      if (advanced) {
        drumSequenceIndexRef.current = nextSequenceIndex;
        setActiveDrumMarkerIndex(activeDrumSequence[nextSequenceIndex]);
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
      lastWheelFrameRef.current = null;
    };
  }, [activeDrumSequence, beatsPerBar, drumAdvanceBeatSpan, isPlaying, tickDuration]);

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

  const renderInnerMarkers = (markerMode) =>
    innerMarkerAngles.map((angle, index) => {
      if (markerMode === "sequence" && index === activeDrumMarkerIndex) {
        const radians = (angle * Math.PI) / 180;
        const x = 50 + Math.cos(radians) * 36;
        const y = 50 + Math.sin(radians) * 36;

        return (
          <text
            key={`inner-number-${index + 1}`}
            className="wheel__inner-mini-number"
            x={x}
            y={y}
          >
            {index + 1}
          </text>
        );
      }

      return (
        <line
          key={`inner-tick-${angle}`}
          className="wheel__inner-mini-tick"
          x1="50"
          y1="1.75"
          x2="50"
          y2="5.75"
          transform={`rotate(${angle + 90} 50 50)`}
        />
      );
    });

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
          {innerCircles.map(({ className, Icon, markerMode }) => (
            <span key={className} className={className}>
              <span className="wheel__inner-circle-shell">
                <span className="wheel__inner-circle">
                  <svg
                    className="wheel__inner-mini-ticks"
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                    focusable="false"
                  >
                    {renderInnerMarkers(markerMode)}
                  </svg>
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
