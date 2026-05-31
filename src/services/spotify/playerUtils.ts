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
 */
export async function waitForDeviceVisible(
  deviceId: string,
  token: string,
  timeoutMs = 15000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const data = await getPlayerDevices(token);
      if (data.devices?.some((d) => d.id === deviceId)) return;
    } catch {
      // ignore transient errors; keep polling
    }
    await new Promise<void>((r) => setTimeout(r, 500));
  }
  throw new Error(`Device ${deviceId} not visible in Spotify API after ${timeoutMs}ms`);
}
