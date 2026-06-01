import type { IframePlayerProxy } from './IframePlayerProxy';
import { startPlayback } from './api';

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
 * Issues PUT /play and retries on 404 with exponential backoff.
 * The SDK `ready` event fires before the device is visible to the REST API,
 * so the first call may 404. Direct retry is more reliable than polling
 * GET /me/player/devices, which can lag 10-20s for newly-registered SDK devices.
 */
export async function playWithRetry(
  deviceId: string,
  uris: string[],
  positionMs: number,
  token: string,
  maxAttempts = 8,
): Promise<void> {
  const delays = [500, 1000, 2000, 4000, 4000, 4000, 4000];
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await startPlayback(deviceId, uris, positionMs, token);
      return;
    } catch (e) {
      const is404 = e instanceof Error && e.message.includes('404');
      if (!is404 || i === maxAttempts - 1) throw e;
      console.debug(`[MashUp] PUT /play 404 attempt ${i + 1}/${maxAttempts}, retrying in ${delays[i]}ms`);
      await new Promise<void>((r) => setTimeout(r, delays[i]));
    }
  }
}
