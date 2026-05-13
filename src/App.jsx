import { useEffect, useRef, useState } from "react";
import {
  CirclePlay,
  Metronome,
  Music2,
  Moon,
  RotateCcw,
  RotateCw,
  Sun
} from "lucide-react";
import Wheel from "./components/Wheel";

function SliderControl({
  ariaLabel,
  icon: Icon,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueText,
  nightMode,
  trailing,
  iconClassName = ""
}) {
  return (
    <div className="flex items-center gap-4">
      {Icon ? (
        <Icon
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`shrink-0 ${
            nightMode ? "text-stone-300" : "text-stone-500"
          } ${iconClassName}`}
        />
      ) : (
        <span className="block h-5 w-5 shrink-0" aria-hidden="true" />
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={valueText}
        className={`range range-xs flex-1 ${
          nightMode ? "range-primary" : "range-neutral"
        }`}
      />

      {trailing}
    </div>
  );
}

function CountSliderControl({
  ariaLabel,
  icon: Icon,
  value,
  min,
  max,
  onChange,
  nightMode,
  trailing
}) {
  return (
    <div className="flex items-center gap-4">
      <Icon
        size={20}
        strokeWidth={1.75}
        aria-hidden="true"
        className={`shrink-0 ${nightMode ? "text-stone-300" : "text-stone-500"}`}
      />

      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={`${value} beats in a bar`}
        className={`range range-xs flex-1 ${
          nightMode ? "range-primary" : "range-neutral"
        }`}
      />

      {trailing}
    </div>
  );
}

function ValueReadout({ children, nightMode }) {
  return (
    <div
      className={`min-w-12 text-right text-sm font-medium tabular-nums ${
        nightMode ? "text-stone-200" : "text-stone-600"
      }`}
    >
      {children}
    </div>
  );
}

function ToggleControl({
  ariaLabel,
  checked,
  onChange,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  nightMode
}) {
  const inactiveClass = nightMode ? "text-stone-600" : "text-stone-300";
  const activeClass = nightMode ? "text-stone-100" : "text-stone-700";

  return (
    <label className="flex items-center gap-2">
      <LeftIcon
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className={checked ? inactiveClass : activeClass}
      />

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={ariaLabel}
        style={nightMode ? { "--tglbg": "#000000" } : undefined}
        className={`toggle toggle-xs ${
          nightMode
            ? "toggle-primary border-stone-500 bg-stone-700 hover:border-stone-400 hover:bg-stone-700 checked:border-primary checked:bg-primary checked:text-black checked:hover:border-primary checked:hover:bg-primary checked:hover:text-black"
            : "border-stone-300 bg-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-200 hover:text-stone-700 checked:border-stone-700 checked:bg-stone-700 checked:text-white checked:hover:border-stone-700 checked:hover:bg-stone-700 checked:hover:text-white"
        }`}
      />

      <RightIcon
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className={checked ? activeClass : inactiveClass}
      />
    </label>
  );
}

export default function App() {
  const audioContextRef = useRef(null);
  const activeVoicesRef = useRef(new Set());
  const isPlayingRef = useRef(false);
  const keyboardPairIndexRef = useRef(0);
  const outerCrotchetIndexRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(116);
  const [playRpm, setPlayRpm] = useState(3.3);
  const [beatsPerBar, setBeatsPerBar] = useState(12);
  const [playClockwise, setPlayClockwise] = useState(false);
  const [dayMode, setDayMode] = useState(false);
  const [outerMuted, setOuterMuted] = useState(false);
  const [mutedTracks, setMutedTracks] = useState({
    keys: false,
    guitar: false,
    drum: false
  });
  const outerMutedRef = useRef(outerMuted);
  const mutedTracksRef = useRef(mutedTracks);
  const nightMode = !dayMode;
  const tickDuration = (beatsPerBar * 60) / bpm;
  const playDuration = 60 / playRpm;

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    mutedTracksRef.current = mutedTracks;
  }, [mutedTracks]);

  useEffect(() => {
    outerMutedRef.current = outerMuted;
  }, [outerMuted]);

  useEffect(() => {
    return () => {
      const audioContext = audioContextRef.current;
      audioContextRef.current = null;
      activeVoicesRef.current.forEach(({ oscillator, gainNode }) => {
        oscillator.onended = null;
        try {
          oscillator.stop();
        } catch {
          // Oscillator may already be stopped.
        }
        oscillator.disconnect();
        gainNode.disconnect();
      });
      activeVoicesRef.current.clear();

      if (audioContext) {
        void audioContext.close();
      }
    };
  }, []);

  const ensureAudioContext = async () => {
    let audioContext = audioContextRef.current;

    if (!audioContext) {
      audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;
    }

    if (audioContext.state !== "running") {
      await audioContext.resume().catch(() => {});
    }

    return audioContextRef.current;
  };

  const stopActiveVoices = () => {
    activeVoicesRef.current.forEach(({ oscillator, gainNode }) => {
      oscillator.onended = null;

      try {
        oscillator.stop();
      } catch {
        // Oscillator may already be stopped.
      }

      oscillator.disconnect();
      gainNode.disconnect();
    });

    activeVoicesRef.current.clear();
  };

  const scheduleVoice = ({
    audioContext,
    startTime,
    type,
    startFrequency,
    endFrequency,
    peakGain,
    attack,
    release,
    duration
  }) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const voice = { oscillator, gainNode };

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      startTime + release
    );

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + release);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    activeVoicesRef.current.add(voice);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    oscillator.onended = () => {
      activeVoicesRef.current.delete(voice);
      oscillator.disconnect();
      gainNode.disconnect();
    };
  };

  const playTickAndTocks = (audioContext = audioContextRef.current) => {
    if (!audioContext || audioContext.state !== "running") {
      return;
    }

    const beatDuration = 60 / bpm;
    const subdivisionDuration = beatDuration / 3;
    const startTime = audioContext.currentTime;

    const muted = mutedTracksRef.current;
    const isOuterBarStart = outerCrotchetIndexRef.current % 4 === 0;
    const outerVoice = isOuterBarStart
      ? {
          startFrequency: 2200,
          endFrequency: 1240,
          peakGain: 0.14,
          release: 0.07,
          duration: 0.075
        }
      : {
          startFrequency: 1760,
          endFrequency: 980,
          peakGain: 0.11,
          release: 0.05,
          duration: 0.055
        };

    if (!outerMutedRef.current) {
      scheduleVoice({
        audioContext,
        startTime,
        type: "square",
        startFrequency: outerVoice.startFrequency,
        endFrequency: outerVoice.endFrequency,
        peakGain: outerVoice.peakGain,
        attack: 0.002,
        release: outerVoice.release,
        duration: outerVoice.duration
      });
    }
    outerCrotchetIndexRef.current = (outerCrotchetIndexRef.current + 1) % 4;

    [0, 1, 2].forEach((subdivisionIndex) => {
      const isHighKeyboardNote = keyboardPairIndexRef.current % 2 === 0;
      const keyboardVoice = isHighKeyboardNote
        ? {
            type: "triangle",
            startFrequency: 880,
            endFrequency: 872,
            peakGain: 0.07
          }
        : {
            type: "triangle",
            startFrequency: 659.25,
            endFrequency: 653,
            peakGain: 0.062
          };

      if (!muted.keys) {
        scheduleVoice({
          audioContext,
          startTime: startTime + subdivisionDuration * subdivisionIndex,
          type: keyboardVoice.type,
          startFrequency: keyboardVoice.startFrequency,
          endFrequency: keyboardVoice.endFrequency,
          peakGain: keyboardVoice.peakGain,
          attack: 0.006,
          release: 0.16,
          duration: 0.17
        });
      }

      keyboardPairIndexRef.current = (keyboardPairIndexRef.current + 1) % 2;
    });

    if (!muted.guitar) {
      scheduleVoice({
        audioContext,
        startTime,
        type: "sawtooth",
        startFrequency: 392,
        endFrequency: 388,
        peakGain: 0.055,
        attack: 0.004,
        release: 0.18,
        duration: 0.19
      });

      scheduleVoice({
        audioContext,
        startTime: startTime + beatDuration / 2,
        type: "sawtooth",
        startFrequency: 493.88,
        endFrequency: 489,
        peakGain: 0.052,
        attack: 0.004,
        release: 0.18,
        duration: 0.19
      });
    }

    if (!muted.drum) {
      [
        {
          startTime,
          startFrequency: 220,
          endFrequency: 96,
          peakGain: 0.16,
          release: 0.13,
          duration: 0.14
        },
        {
          startTime: startTime + subdivisionDuration,
          startFrequency: 165,
          endFrequency: 78,
          peakGain: 0.15,
          release: 0.14,
          duration: 0.15
        },
        {
          startTime: startTime + subdivisionDuration * 2,
          startFrequency: 165,
          endFrequency: 78,
          peakGain: 0.15,
          release: 0.14,
          duration: 0.15
        }
      ].forEach((tomVoice) => {
        scheduleVoice({
          audioContext,
          startTime: tomVoice.startTime,
          type: "sine",
          startFrequency: tomVoice.startFrequency,
          endFrequency: tomVoice.endFrequency,
          peakGain: tomVoice.peakGain,
          attack: 0.002,
          release: tomVoice.release,
          duration: tomVoice.duration
        });
      });
    }
  };

  const handleToggleTrackMute = (trackId) => {
    setMutedTracks((currentMutedTracks) => ({
      ...currentMutedTracks,
      [trackId]: !currentMutedTracks[trackId]
    }));
  };

  const handleToggleOuterMute = () => {
    setOuterMuted((currentOuterMuted) => !currentOuterMuted);
  };

  const handleTogglePlay = async () => {
    const nextPlaying = !isPlayingRef.current;
    isPlayingRef.current = nextPlaying;
    setIsPlaying(nextPlaying);

    if (!nextPlaying) {
      keyboardPairIndexRef.current = 0;
      outerCrotchetIndexRef.current = 0;
      stopActiveVoices();
      return;
    }

    keyboardPairIndexRef.current = 0;
    outerCrotchetIndexRef.current = 0;
    const audioContext = await ensureAudioContext();

    if (isPlayingRef.current) {
      playTickAndTocks(audioContext);
    }
  };

  return (
    <div
      className={`h-dvh overflow-hidden px-5 py-8 transition-colors ${
        dayMode ? "bg-white" : "bg-stone-950"
      }`}
    >
      <main className="mx-auto flex h-full w-full max-w-[24rem] flex-col items-center gap-10">
        <section className="w-full pt-2">
          <div className="grid gap-5">
            <SliderControl
              ariaLabel="Tick spin speed"
              icon={Metronome}
              value={bpm}
              min={20}
              max={240}
              step={1}
              onChange={setBpm}
              valueText={`${bpm} beats per minute`}
              nightMode={nightMode}
              trailing={<ValueReadout nightMode={nightMode}>{bpm}</ValueReadout>}
            />
            <SliderControl
              ariaLabel="Play spin speed"
              icon={CirclePlay}
              value={playRpm}
              min={1}
              max={20}
              step={0.1}
              onChange={setPlayRpm}
              valueText={`${playRpm.toFixed(1)} revolutions per minute`}
              nightMode={nightMode}
              trailing={
                <div className="flex items-center gap-3">
                  <ValueReadout nightMode={nightMode}>
                    {playRpm.toFixed(1)}
                  </ValueReadout>
                  <ToggleControl
                    ariaLabel="Play rotation direction"
                    checked={playClockwise}
                    onChange={setPlayClockwise}
                    leftIcon={RotateCw}
                    rightIcon={RotateCcw}
                    nightMode={nightMode}
                  />
                </div>
              }
            />
            <CountSliderControl
              ariaLabel="Beats in a bar"
              icon={Music2}
              value={beatsPerBar}
              min={2}
              max={16}
              onChange={setBeatsPerBar}
              nightMode={nightMode}
              trailing={<ValueReadout nightMode={nightMode}>{beatsPerBar}</ValueReadout>}
            />
          </div>
        </section>

        <section className="flex w-full flex-1 items-center justify-center">
          <Wheel
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onBeat={playTickAndTocks}
            tickDuration={tickDuration}
            playDuration={playDuration}
            beatsPerBar={beatsPerBar}
            playClockwise={playClockwise}
            dayMode={dayMode}
            outerMuted={outerMuted}
            onToggleOuterMute={handleToggleOuterMute}
            mutedTracks={mutedTracks}
            onToggleTrackMute={handleToggleTrackMute}
          />
        </section>

        <section className="flex w-full justify-end pb-1">
          <ToggleControl
            ariaLabel="Day or night mode"
            checked={dayMode}
            onChange={setDayMode}
            leftIcon={Moon}
            rightIcon={Sun}
            nightMode={nightMode}
          />
        </section>
      </main>
    </div>
  );
}
