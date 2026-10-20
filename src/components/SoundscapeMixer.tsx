import React from 'react';
import { Volume2, VolumeX, Sparkles, RefreshCw } from 'lucide-react';
import { SoundTrackState, SoundType } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface SoundscapeMixerProps {
  tracks: SoundTrackState[];
  setTracks: React.Dispatch<React.SetStateAction<SoundTrackState[]>>;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const PRESET_MIXES: { name: string; desc: string; active: { id: SoundType; vol: number }[] }[] = [
  {
    name: '40Hz Deep Gamma',
    desc: 'Scientifically calibrated 40Hz auditory stimulation for peak cognitive focus',
    active: [
      { id: 'binaural', vol: 0.65 },
      { id: 'brownnoise', vol: 0.25 },
    ],
  },
  {
    name: 'Rainy Library',
    desc: 'Gentle rainfall against high windows with distant warm room tone',
    active: [
      { id: 'rain', vol: 0.7 },
      { id: 'pinknoise', vol: 0.2 },
    ],
  },
  {
    name: 'Lo-Fi Cafe Sanctuary',
    desc: 'Warm analog vinyl texture paired with steady grounding noise',
    active: [
      { id: 'lofi', vol: 0.6 },
      { id: 'brownnoise', vol: 0.35 },
    ],
  },
  {
    name: 'Solitary Forest',
    desc: 'Wind rustling through pine needles with natural organic space',
    active: [
      { id: 'forest', vol: 0.75 },
      { id: 'pinknoise', vol: 0.15 },
    ],
  },
];

export const SoundscapeMixer: React.FC<SoundscapeMixerProps> = ({
  tracks,
  setTracks,
  masterVolume,
  setMasterVolume,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const toggleTrack = (id: SoundType) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = !t.isPlaying;
          if (nextState) {
            soundEngine.playTrack(id, t.volume);
          } else {
            soundEngine.stopTrack(id);
          }
          return { ...t, isPlaying: nextState };
        }
        return t;
      })
    );
  };

  const handleTrackVolumeChange = (id: SoundType, vol: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          soundEngine.setTrackVolume(id, vol);
          return { ...t, volume: vol };
        }
        return t;
      })
    );
  };

  const handleMasterVolume = (vol: number) => {
    setMasterVolume(vol);
    soundEngine.setMasterVolume(vol);
  };

  const applyPreset = (preset: (typeof PRESET_MIXES)[0]) => {
    soundEngine.stopAll();
    const activeIds = new Map(preset.active.map((a) => [a.id, a.vol]));

    setTracks((prev) =>
      prev.map((t) => {
        const isSelected = activeIds.has(t.id);
        const vol = isSelected ? activeIds.get(t.id)! : t.volume;
        if (isSelected) {
          soundEngine.playTrack(t.id, vol);
        }
        return {
          ...t,
          isPlaying: isSelected,
          volume: vol,
        };
      })
    );
  };

  const stopAllSounds = () => {
    soundEngine.stopAll();
    setTracks((prev) => prev.map((t) => ({ ...t, isPlaying: false })));
  };

  const activeCount = tracks.filter((t) => t.isPlaying).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-100">Ambient Soundscape Mixer</h2>
              {activeCount > 0 && (
                <span className="text-xs text-amber-400 font-mono">
                  {activeCount} active
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Zero-latency synthesized audio calibrated for uninterrupted focus
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 text-sm p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close sound mixer"
          >
            ✕
          </button>
        </div>

        {/* Master Controls & Presets */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/50 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              {masterVolume > 0 ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
              <span className="font-medium">Master Volume</span>
            </div>
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => handleMasterVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-neutral-400 w-9 text-right tabular-nums">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
            {activeCount > 0 && (
              <button
                onClick={stopAllSounds}
                className="text-xs text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-neutral-800/60"
              >
                <RefreshCw className="w-3 h-3" />
                Mute All
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-xs text-neutral-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Curated Focus Presets</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_MIXES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-2.5 text-left rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/80 transition-all group"
                >
                  <div className="text-xs font-medium text-neutral-200 group-hover:text-amber-400 transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Individual Tracks */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
            Synthesized Audio Channels
          </div>

          {tracks.map((track) => (
            <div
              key={track.id}
              className={`p-3.5 rounded-xl border transition-all ${
                track.isPlaying
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTrack(track.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      track.isPlaying
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                    aria-label={`Toggle ${track.name}`}
                  >
                    {track.isPlaying ? '■' : '▶'}
                  </button>
                  <div>
                    <div className="text-xs font-medium text-neutral-200 flex items-center gap-2">
                      {track.name}
                      {track.id === 'binaural' && (
                        <span className="text-[10px] text-amber-400 font-mono">
                          40Hz Gamma
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400">{track.description}</div>
                  </div>
                </div>

                <span className="text-xs font-mono text-neutral-400 tabular-nums">
                  {track.isPlaying ? `${Math.round(track.volume * 100)}%` : 'Off'}
                </span>
              </div>

              {track.isPlaying && (
                <div className="pl-10 pr-2 pt-1 flex items-center gap-3 animate-in fade-in duration-100">
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.02"
                    value={track.volume}
                    onChange={(e) => handleTrackVolumeChange(track.id, parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Procedural Web Audio · Zero streaming bandwidth
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
