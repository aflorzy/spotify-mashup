// Manages SDK lifecycle and player events.
// Implemented by: feature/services agent
export function useSpotifyPlayer(_role: 'A' | 'B') {
  return { player: null, deviceId: null, ready: false };
}
