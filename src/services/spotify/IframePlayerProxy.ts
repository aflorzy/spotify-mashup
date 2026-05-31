export class IframePlayerProxy {
  private iframe: HTMLIFrameElement;
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private pendingStates = new Map<string, (state: Spotify.PlaybackState | null) => void>();
  private getTokenFn: () => Promise<string>;
  private msgHandler: (event: MessageEvent) => void;
  private loaded = false;
  private sendQueue: object[] = [];
  private _deviceId: string | null = null;

  constructor(getTokenFn: () => Promise<string>) {
    this.getTokenFn = getTokenFn;

    this.iframe = document.createElement('iframe');
    this.iframe.src = '/player-frame.html';
    this.iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none';
    this.iframe.setAttribute('allow', 'autoplay');
    document.body.appendChild(this.iframe);

    this.iframe.addEventListener('load', () => {
      this.loaded = true;
      for (const msg of this.sendQueue) {
        this.iframe.contentWindow?.postMessage(msg, window.location.origin);
      }
      this.sendQueue = [];
    });

    this.msgHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.msgHandler);
  }

  private handleMessage(event: MessageEvent): void {
    if (event.source !== this.iframe.contentWindow) return;
    const msg = event.data as Record<string, unknown>;
    const type = msg?.type;

    if (type === 'ready') {
      this._deviceId = msg.deviceId as string;
      this.emit(type, msg);
    } else if (type === 'not_ready') {
      this._deviceId = null;
      this.emit(type, msg);
    } else if (type === 'player_state_changed') {
      this.emit('player_state_changed', msg.state as Spotify.PlaybackState | null);
    } else if (type === 'state') {
      const reqId = msg.reqId as string;
      const resolve = this.pendingStates.get(reqId);
      if (resolve) {
        this.pendingStates.delete(reqId);
        resolve(msg.state as Spotify.PlaybackState | null);
      }
    } else if (type === 'token_request') {
      this.getTokenFn()
        .then((token) => this.send({ type: 'set_token', token }))
        .catch(() => {});
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  private send(msg: object): void {
    if (this.loaded) {
      this.iframe.contentWindow?.postMessage(msg, window.location.origin);
    } else {
      this.sendQueue.push(msg);
    }
  }

  get deviceId(): string | null {
    return this._deviceId;
  }

  init(name: string, token: string, volume = 1): void {
    this.send({ type: 'init', name, token, volume });
  }

  setToken(token: string): void {
    this.send({ type: 'set_token', token });
  }

  setVolume(volume: number): Promise<void> {
    this.send({ type: 'set_volume', volume });
    return Promise.resolve();
  }

  pause(): Promise<void> {
    this.send({ type: 'pause' });
    return Promise.resolve();
  }

  resume(): Promise<void> {
    this.send({ type: 'resume' });
    return Promise.resolve();
  }

  getCurrentState(): Promise<Spotify.PlaybackState | null> {
    return new Promise((resolve) => {
      const reqId = Math.random().toString(36).slice(2);
      this.pendingStates.set(reqId, resolve);
      this.send({ type: 'get_state', reqId });
    });
  }

  addListener(event: 'player_state_changed', cb: (state: Spotify.PlaybackState | null) => void): boolean;
  addListener(event: 'ready', cb: (data: { deviceId: string }) => void): boolean;
  addListener(event: 'not_ready', cb: () => void): boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener(event: string, cb: (...args: any[]) => void): boolean {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.listeners.get(event)!.add(cb as (...args: unknown[]) => void);
    return true;
  }

  removeListener(event: string, cb?: (...args: unknown[]) => void): boolean {
    if (!cb) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(cb);
    }
    return true;
  }

  activate(): void {
    this.send({ type: 'activate' });
  }

  destroy(): void {
    this.send({ type: 'disconnect' });
    window.removeEventListener('message', this.msgHandler);
    this.iframe.remove();
    this.loaded = false;
    this._deviceId = null;
    for (const resolve of this.pendingStates.values()) {
      resolve(null);
    }
    this.pendingStates.clear();
  }
}
