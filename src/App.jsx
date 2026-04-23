import { useState } from "react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(30);
  const [playRpm, setPlayRpm] = useState(3.3);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [playClockwise, setPlayClockwise] = useState(false);
  const [dayMode, setDayMode] = useState(false);
  const nightMode = !dayMode;
  const tickDuration = (beatsPerBar * 60) / bpm;
  const playDuration = 60 / playRpm;

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
            onTogglePlay={() => setIsPlaying((current) => !current)}
            tickDuration={tickDuration}
            playDuration={playDuration}
            beatsPerBar={beatsPerBar}
            playClockwise={playClockwise}
            dayMode={dayMode}
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
