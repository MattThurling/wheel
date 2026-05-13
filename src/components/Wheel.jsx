import { Drum, Guitar, KeyboardMusic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const innerCircles = [
  {
    id: "keys",
    label: "Keys",
    className: "wheel__inner-orbit wheel__inner-orbit--one",
    Icon: KeyboardMusic,
    markerMode: "tripletPairs"
  },
  {
    id: "guitar",
    label: "Guitar",
    className: "wheel__inner-orbit wheel__inner-orbit--two",
    Icon: Guitar,
    markerMode: "quavers"
  },
  {
    id: "drum",
    label: "Drum",
    className: "wheel__inner-orbit wheel__inner-orbit--three",
    Icon: Drum,
    markerMode: "pulse"
  }
];

export default function Wheel({
  isPlaying,
  onTogglePlay,
  onBeat,
  tickDuration,
  playDuration,
  beatsPerBar,
  playClockwise,
  dayMode,
  outerMuted,
  onToggleOuterMute,
  mutedTracks,
  onToggleTrackMute
}) {
  const wheelShellRef = useRef(null);
  const tickAngles = Array.from(
    { length: beatsPerBar },
    (_, index) => (index * 360) / beatsPerBar
  );
  const innerMarkerAngles = Array.from({ length: 12 }, (_, index) => index * 30);
  const playButtonRef = useRef(null);
  const onBeatRef = useRef(onBeat);
  const wheelAngleRef = useRef(0);
  const playAngleRef = useRef(0);
  const drumPulseIndexRef = useRef(0);
  const guitarQuaverIndexRef = useRef(0);
  const tripletStepRef = useRef(0);
  const subdivisionAccumulatorRef = useRef(0);
  const guitarAccumulatorRef = useRef(0);
  const lastWheelFrameRef = useRef(null);
  const lastFrameRef = useRef(null);
  const [activeDrumPulseIndex, setActiveDrumPulseIndex] = useState(0);
  const [activeGuitarQuaverIndex, setActiveGuitarQuaverIndex] = useState(0);

  useEffect(() => {
    onBeatRef.current = onBeat;
  }, [onBeat]);

  useEffect(() => {
    wheelAngleRef.current = 0;
    playAngleRef.current = 0;
    drumPulseIndexRef.current = 0;
    guitarQuaverIndexRef.current = 0;
    tripletStepRef.current = 0;
    subdivisionAccumulatorRef.current = 0;
    guitarAccumulatorRef.current = 0;
    lastWheelFrameRef.current = null;
    lastFrameRef.current = null;

    wheelShellRef.current?.style.setProperty("--wheel-angle", "0deg");
    playButtonRef.current?.style.setProperty("--play-angle", "0deg");
    setActiveDrumPulseIndex(0);
    setActiveGuitarQuaverIndex(0);
  }, [beatsPerBar]);

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

      subdivisionAccumulatorRef.current += delta;
      guitarAccumulatorRef.current += delta;
      const subdivisionDuration = (tickDuration * 1000) / (beatsPerBar * 3);
      const quaverDuration = (tickDuration * 1000) / (beatsPerBar * 2);
      let nextPulseIndex = drumPulseIndexRef.current;
      let nextGuitarQuaverIndex = guitarQuaverIndexRef.current;
      let nextTripletStep = tripletStepRef.current;
      let advanced = false;
      let advancedGuitar = false;

      while (guitarAccumulatorRef.current >= quaverDuration) {
        guitarAccumulatorRef.current -= quaverDuration;
        nextGuitarQuaverIndex = (nextGuitarQuaverIndex + 1) % innerMarkerAngles.length;
        advancedGuitar = true;
      }

      while (subdivisionAccumulatorRef.current >= subdivisionDuration) {
        subdivisionAccumulatorRef.current -= subdivisionDuration;
        nextPulseIndex = (nextPulseIndex + 1) % innerMarkerAngles.length;
        nextTripletStep = (nextTripletStep + 1) % 3;
        advanced = true;

        if (nextTripletStep === 0) {
          onBeatRef.current?.();
        }
      }

      if (advancedGuitar) {
        guitarQuaverIndexRef.current = nextGuitarQuaverIndex;
        setActiveGuitarQuaverIndex(nextGuitarQuaverIndex);
      }

      if (advanced) {
        drumPulseIndexRef.current = nextPulseIndex;
        tripletStepRef.current = nextTripletStep;
        setActiveDrumPulseIndex(nextPulseIndex);
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
      lastWheelFrameRef.current = null;
    };
  }, [beatsPerBar, innerMarkerAngles.length, isPlaying, tickDuration]);

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

  const renderInnerMarkers = (markerMode) => {
    const markerAngles = innerMarkerAngles;

    return markerAngles.map((angle, index) => {
      if (markerMode === "tripletPairs") {
        const isTick = index % 2 === 0;
        const isActive = isPlaying && index === activeDrumPulseIndex;
        const shouldShowNumber = isActive && isTick;
        const radians = (angle * Math.PI) / 180;
        const x = 50 + Math.cos(radians) * 46.25;
        const y = 50 + Math.sin(radians) * 46.25;

        return (
          <g key={`inner-triplet-pair-${angle}`}>
            {shouldShowNumber ? null : (
              <line
                className={`wheel__inner-mini-tick ${
                  isActive ? "wheel__inner-mini-tick--active" : ""
                }`}
                x1="50"
                y1="1.75"
                x2="50"
                y2="5.75"
                transform={`rotate(${angle + 90} 50 50)`}
              />
            )}
            {shouldShowNumber ? (
              <text
                className="wheel__inner-mini-number wheel__inner-mini-number--pulse"
                x={x}
                y={y}
              >
                {index + 1}
              </text>
            ) : null}
          </g>
        );
      }

      if (markerMode === "quavers") {
        const isTick = index % 2 === 0;
        const isActive = isPlaying && index === activeGuitarQuaverIndex;
        const shouldShowNumber = isActive && isTick;
        const radians = (angle * Math.PI) / 180;
        const x = 50 + Math.cos(radians) * 46.25;
        const y = 50 + Math.sin(radians) * 46.25;

        return (
          <g key={`inner-quaver-${angle}`}>
            {shouldShowNumber ? null : (
              <line
                className={`wheel__inner-mini-tick ${
                  isActive ? "wheel__inner-mini-tick--active" : ""
                }`}
                x1="50"
                y1="1.75"
                x2="50"
                y2="5.75"
                transform={`rotate(${angle + 90} 50 50)`}
              />
            )}
            {shouldShowNumber ? (
              <text
                className="wheel__inner-mini-number wheel__inner-mini-number--pulse"
                x={x}
                y={y}
              >
                {index + 1}
              </text>
            ) : null}
          </g>
        );
      }

      if (markerMode === "pulse") {
        const isQuarterBeat = index % 3 === 0;
        const shouldShowNumber =
          isPlaying && isQuarterBeat && index === activeDrumPulseIndex;
        const radians = (angle * Math.PI) / 180;
        const x = 50 + Math.cos(radians) * 46.25;
        const y = 50 + Math.sin(radians) * 46.25;

        return (
          <g key={`inner-pulse-${angle}`}>
            {shouldShowNumber ? null : (
              <line
                className={`wheel__inner-mini-tick ${
                  isPlaying && index === activeDrumPulseIndex
                    ? "wheel__inner-mini-tick--active"
                    : ""
                }`}
                x1="50"
                y1="1.75"
                x2="50"
                y2="5.75"
                transform={`rotate(${angle + 90} 50 50)`}
              />
            )}
            {shouldShowNumber ? (
              <text
                className="wheel__inner-mini-number wheel__inner-mini-number--pulse"
                x={x}
                y={y}
              >
                {index + 1}
              </text>
            ) : null}
          </g>
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
  };

  return (
    <div
      ref={wheelShellRef}
      className="wheel-shell"
      onClick={onToggleOuterMute}
      style={{
        "--wheel-angle": "0deg",
        "--wheel-spin-duration": `${tickDuration}s`,
        "--play-spin-duration": `${playDuration}s`,
        "--wheel-play-state": isPlaying ? "running" : "paused",
        "--wheel-highlight-opacity": isPlaying && !outerMuted ? 1 : 0,
        "--wheel-spin-direction": "normal",
        "--play-spin-direction": playClockwise ? "normal" : "reverse",
        "--wheel-border-color": dayMode ? "rgb(188 188 188)" : "rgb(120 120 128)",
        "--wheel-tick-color": dayMode ? "rgb(228 228 228)" : "rgb(48 48 52)",
        "--wheel-highlight-color": dayMode ? "rgb(0 0 0)" : "rgb(255 255 255)",
        "--wheel-inner-icon-color": dayMode ? "rgb(84 84 84)" : "rgb(224 224 228)",
        "--wheel-inner-tick-color": dayMode ? "rgb(136 136 136)" : "rgb(150 150 156)",
        "--wheel-inner-muted-icon-color": dayMode ? "rgb(164 164 164)" : "rgb(92 92 96)",
        "--wheel-inner-active-tick-color": dayMode ? "rgb(0 0 0)" : "rgb(255 255 255)",
        "--wheel-play-color": dayMode ? "rgb(122 122 122)" : "rgb(245 245 245)"
      }}
    >
      <div className="wheel__rotor">
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
          {innerCircles.map(({ id, label, className, Icon, markerMode }) => {
            const isMuted = mutedTracks[id];

            return (
            <span key={className} className={className}>
              <button
                type="button"
                className="wheel__inner-circle-shell"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleTrackMute(id);
                }}
                aria-label={`${isMuted ? "Unmute" : "Mute"} ${label}`}
                aria-pressed={isMuted}
              >
                <span
                  className={`wheel__inner-circle ${
                    isMuted ? "wheel__inner-circle--muted" : ""
                  }`}
                >
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
                    className={`wheel__inner-icon ${
                      isMuted ? "wheel__inner-icon--muted" : ""
                    }`}
                  />
                </span>
              </button>
            </span>
            );
          })}
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
        onClick={(event) => {
          event.stopPropagation();
          onTogglePlay();
        }}
        aria-label={isPlaying ? "Stop rotation" : "Start rotation"}
        aria-pressed={isPlaying}
      >
        <span className="wheel__play-icon" aria-hidden="true" />
      </button>
    </div>
  );
}
