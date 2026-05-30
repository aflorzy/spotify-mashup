export type EngineState = 'idle' | 'playing' | 'fading' | 'paused' | 'stopped';

export interface EngineStatus {
  state: EngineState;
  currentIndex: number;
  activePlayer: 'A' | 'B';
  position: number;
  fadeProgress: number;
}
