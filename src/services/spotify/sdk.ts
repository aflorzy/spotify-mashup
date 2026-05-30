let sdkReadyResolve: (() => void) | null = null;

export const sdkReadyPromise = new Promise<void>((resolve) => {
  sdkReadyResolve = resolve;
});

export function initSdk(onReady: () => void): void {
  window.onSpotifyWebPlaybackSDKReady = () => {
    sdkReadyResolve?.();
    onReady();
  };
}

export function createPlayer(
  name: string,
  getToken: (cb: (token: string) => void) => void,
  volume = 1,
): Spotify.Player {
  return new window.Spotify.Player({ name, getOAuthToken: getToken, volume });
}
