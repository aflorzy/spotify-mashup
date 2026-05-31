import type { IframePlayerProxy } from './IframePlayerProxy';

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
