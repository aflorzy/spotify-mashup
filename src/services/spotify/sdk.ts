// Spotify Web Playback SDK initialization and player factory.
// Implemented by: feature/services agent

export function initSdk(onReady: () => void): void {
  throw new Error(`Not implemented: ${onReady}`);
}

export function createPlayer(
  name: string,
  getToken: (cb: (token: string) => void) => void,
  volume = 1,
): Spotify.Player {
  throw new Error(`Not implemented: ${name} ${getToken} ${volume}`);
}
