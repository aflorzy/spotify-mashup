import type { IframePlayerProxy } from './IframePlayerProxy';
import { getPlayerDevices } from './api';

export async function waitForDevice(
  proxy: IframePlayerProxy,
  timeoutMs = 10000
): Promise<string> {
  if (proxy.deviceId) return proxy.deviceId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      proxy.removeListener('ready', onReady);
      reject(new Error('Device ready timeout'));
    }, timeoutMs);
    const onReady = ({ deviceId }: { deviceId: string }) => {
      clearTimeout(timer);
      resolve(deviceId);
    };
    proxy.addListener('ready', onReady);
  });
}

/**
 * Polls GET /me/player/devices until the given deviceId appears in Spotify's
 * backend. The SDK `ready` event fires before backend registration completes,
 * so this gate prevents the 404 "Device not found" race on PUT /play.
 * Uses exponential backoff to avoid polling storms when multiple callers fire.
 */
export async function waitForDeviceVisible(
  deviceId: string,
  token: string,
  maxAttempts = 5
): Promise<void> {
  const delays = [500, 1000, 2000, 4000, 8000];
  for (let i = 0; i < maxAttempts; i++) {
    console.debug(
      `[MashUp] devices poll attempt ${i + 1}/${maxAttempts}`,
      'device:', deviceId,
      'token:', token.slice(0, 10) + '…'
    );
    try {
      const data = await getPlayerDevices(token);
      if (data.devices?.some((d) => d.id === deviceId)) return;
    } catch {
      // transient error — retry
    }
    if (i < maxAttempts - 1) {
      await new Promise<void>((r) => setTimeout(r, delays[i]));
    }
  }
  throw new Error(`Device ${deviceId} not visible after ${maxAttempts} polling attempts`);
}
