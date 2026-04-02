import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// ../browser/dist/index.js
var SessionManager = class {
  sessions = /* @__PURE__ */ new Map();
  snapshotWaiters = [];
  openSession(tabId, url, title) {
    this.sessions.set(tabId, {
      tabId,
      url,
      title,
      snapshot: null,
      openedAt: Date.now()
    });
  }
  closeSession(tabId) {
    this.sessions.delete(tabId);
  }
  getSession(tabId) {
    return this.sessions.get(tabId) ?? null;
  }
  getSessions() {
    return [...this.sessions.values()];
  }
  updateSnapshot(tabId, snapshot) {
    const session = this.sessions.get(tabId);
    if (session) {
      session.snapshot = snapshot;
      this.notifyWaiters();
    }
  }
  getSnapshot(tabId) {
    return this.sessions.get(tabId)?.snapshot ?? null;
  }
  hasReadySession() {
    for (const session of this.sessions.values()) {
      if (session.snapshot !== null) return true;
    }
    return false;
  }
  waitForSnapshot(timeoutMs) {
    if (this.hasReadySession()) return Promise.resolve(true);
    return new Promise((resolve) => {
      const onReady = () => {
        clearTimeout(timer);
        resolve(true);
      };
      const timer = setTimeout(() => {
        const idx = this.snapshotWaiters.indexOf(onReady);
        if (idx !== -1) this.snapshotWaiters.splice(idx, 1);
        resolve(false);
      }, timeoutMs);
      this.snapshotWaiters.push(onReady);
    });
  }
  notifyWaiters() {
    if (!this.hasReadySession()) return;
    const waiters = this.snapshotWaiters.splice(0);
    for (const waiter of waiters) waiter();
  }
};
var CommandQueue = class {
  sender = null;
  pending = /* @__PURE__ */ new Map();
  senderWaiters = [];
  counter = 0;
  setSender(sender) {
    this.sender = sender;
    if (sender) {
      const waiters = this.senderWaiters.splice(0);
      for (const w of waiters) w();
    }
  }
  sendRaw(msg) {
    if (this.sender) this.sender(msg);
  }
  hasSender() {
    return this.sender !== null;
  }
  waitForSender(timeoutMs) {
    if (this.sender) return Promise.resolve(true);
    return new Promise((resolve) => {
      const onReady = () => {
        clearTimeout(timer);
        resolve(true);
      };
      const timer = setTimeout(() => {
        const idx = this.senderWaiters.indexOf(onReady);
        if (idx !== -1) this.senderWaiters.splice(idx, 1);
        resolve(false);
      }, timeoutMs);
      this.senderWaiters.push(onReady);
    });
  }
  enqueue(tabId, command, opts) {
    const timeoutMs = opts?.timeoutMs ?? 3e4;
    const commandId = `cmd-${++this.counter}-${Date.now()}`;
    const msg = {
      type: "command_request",
      tabId,
      commandId,
      command
    };
    if (this.sender) {
      this.sender(msg);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(commandId);
        reject(new Error("Command timed out"));
      }, timeoutMs);
      this.pending.set(commandId, { resolve, reject, timer });
    });
  }
  resolve(commandId, result) {
    const entry = this.pending.get(commandId);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(commandId);
    entry.resolve(result);
  }
};
var ActivityBlockStack = class {
  constructor(onActiveChange) {
    this.onActiveChange = onActiveChange;
  }
  blocks = [];
  counter = 0;
  expiryTimer = null;
  active = false;
  pushGuard(kind) {
    const id = this.nextId(kind);
    this.blocks.push({ id, kind, expiresAt: null });
    this.sync();
    return id;
  }
  pushTimed(kind, ttlMs) {
    const id = this.nextId(kind);
    this.blocks.push({ id, kind, expiresAt: Date.now() + ttlMs });
    this.sync();
    return id;
  }
  release(id) {
    const next = this.blocks.filter((block) => block.id !== id);
    if (next.length === this.blocks.length) {
      return;
    }
    this.blocks = next;
    this.sync();
  }
  hasActiveBlocks() {
    this.pagruneExpired();
    return this.blocks.length > 0;
  }
  getBlocks() {
    this.pagruneExpired();
    return [...this.blocks];
  }
  nextId(kind) {
    this.counter += 1;
    return `${kind}-${this.counter}`;
  }
  pagruneExpired() {
    const now = Date.now();
    const next = this.blocks.filter((block) => block.expiresAt == null || block.expiresAt > now);
    if (next.length !== this.blocks.length) {
      this.blocks = next;
    }
  }
  sync() {
    this.pagruneExpired();
    this.scheduleNextExpiry();
    const nextActive = this.blocks.length > 0;
    if (nextActive !== this.active) {
      this.active = nextActive;
      this.onActiveChange(nextActive);
    }
  }
  scheduleNextExpiry() {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    const nextExpiry = this.blocks.map((block) => block.expiresAt).filter((expiresAt) => expiresAt != null).sort((left, right) => left - right)[0];
    if (nextExpiry == null) {
      return;
    }
    const delay = Math.max(0, nextExpiry - Date.now());
    this.expiryTimer = setTimeout(() => {
      this.expiryTimer = null;
      this.sync();
    }, delay);
  }
};
var ACTIVITY_TAIL_BLOCK_MS = 5e3;
var ENSURE_READY_TIMEOUT_MS = 1e4;
var ExtensionDriver = class {
  sessions = new SessionManager();
  commands = new CommandQueue();
  activityBlocks;
  sessionOpenCbs = [];
  sessionCloseCbs = [];
  snapshotUpdateCbs = [];
  pendingResync = null;
  onActivity = null;
  constructor() {
    this.activityBlocks = new ActivityBlockStack((active) => {
      this.commands.sendRaw({ type: "agent_activity", active });
    });
  }
  // --- BrowserDriver interface ---
  async connect() {
  }
  async disconnect() {
    this.commands.setSender(null);
  }
  isConnected() {
    return this.commands.hasSender();
  }
  listSessions() {
    return this.sessions.getSessions().map((s) => ({
      tabId: s.tabId,
      url: s.url,
      title: s.title,
      hasSnapshot: s.snapshot != null
    }));
  }
  getSnapshot(tabId) {
    return this.sessions.getSnapshot(tabId);
  }
  onSessionOpen(cb) {
    this.sessionOpenCbs.push(cb);
  }
  onSessionClose(cb) {
    this.sessionCloseCbs.push(cb);
  }
  onSnapshotUpdate(cb) {
    this.snapshotUpdateCbs.push(cb);
  }
  async execute(tabId, command) {
    return this.withActivityBlocks(
      command.kind,
      () => this.commands.enqueue(tabId, command)
    );
  }
  sendRaw(msg) {
    this.commands.sendRaw(msg);
  }
  // --- Extension-specific methods ---
  setNativeSender(sender) {
    this.commands.setSender(sender);
  }
  handleNativeMessage(msg) {
    switch (msg.type) {
      case "session_open": {
        this.sessions.openSession(msg.tabId, msg.url, msg.title);
        this.sessionOpenCbs.forEach(
          (cb) => cb({
            tabId: msg.tabId,
            url: msg.url,
            title: msg.title,
            hasSnapshot: false
          })
        );
        break;
      }
      case "session_close": {
        this.sessions.closeSession(msg.tabId);
        this.sessionCloseCbs.forEach((cb) => cb(msg.tabId));
        break;
      }
      case "snapshot_update": {
        this.sessions.updateSnapshot(msg.tabId, msg.snapshot);
        this.snapshotUpdateCbs.forEach((cb) => cb(msg.tabId, msg.snapshot));
        break;
      }
      case "command_result": {
        if (msg.result.snapshot) {
          this.sessions.updateSnapshot(msg.tabId, msg.result.snapshot);
        }
        this.commands.resolve(msg.commandId, msg.result);
        break;
      }
      case "ping":
        this.commands.sendRaw({ type: "pong" });
        break;
      case "get_status":
        this.commands.sendRaw(this.createStatusResponse());
        break;
      case "resync_request":
      case "pong":
      case "status_response":
        break;
    }
  }
  async ensureReady() {
    const deadline = Date.now() + ENSURE_READY_TIMEOUT_MS;
    if (!this.commands.hasSender()) {
      const connected = await this.commands.waitForSender(ENSURE_READY_TIMEOUT_MS);
      if (!connected) {
        return "Native host not connected. Ensure the browser extension is installed and running.";
      }
    }
    if (this.sessions.hasReadySession()) return null;
    const remaining = Math.max(0, deadline - Date.now());
    if (remaining === 0) {
      return "No browser sessions available. Ensure a page with agrune annotations is open.";
    }
    if (!this.pendingResync) {
      this.commands.sendRaw({ type: "resync_request" });
      this.pendingResync = this.sessions.waitForSnapshot(remaining).finally(() => {
        this.pendingResync = null;
      });
    }
    const ready = await this.pendingResync;
    if (!ready) {
      return "No browser sessions available. Ensure a page with agrune annotations is open.";
    }
    return null;
  }
  resolveTabId(tabId) {
    if (typeof tabId === "number") return tabId;
    const all = this.sessions.getSessions();
    return all.length > 0 ? all[0].tabId : null;
  }
  // --- Internal helpers ---
  async withActivityBlocks(kind, effect) {
    const guardId = this.activityBlocks.pushGuard(`${kind}:guard`);
    try {
      return await effect();
    } finally {
      this.activityBlocks.pushTimed(`${kind}:tail`, ACTIVITY_TAIL_BLOCK_MS);
      this.activityBlocks.release(guardId);
    }
  }
  createStatusResponse() {
    return {
      type: "status_response",
      status: {
        hostName: "com.agrune.agrune",
        phase: "connected",
        connected: true,
        lastError: null,
        sessionCount: this.sessions.getSessions().length,
        mcpConnected: this.activityBlocks.hasActiveBlocks()
      }
    };
  }
};
function encodeMessage(msg) {
  const json = JSON.stringify(msg);
  const payload = Buffer.from(json, "utf-8");
  const header = Buffer.alloc(4);
  header.writeUInt32LE(payload.length, 0);
  return Buffer.concat([header, payload]);
}
function decodeMessages(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 4 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    if (offset + 4 + length > buffer.length) {
      break;
    }
    const json = buffer.subarray(offset + 4, offset + 4 + length).toString("utf-8");
    messages.push(JSON.parse(json));
    offset += 4 + length;
  }
  return {
    messages,
    remaining: buffer.subarray(offset)
  };
}
function createNativeMessagingTransport(input, output) {
  const listeners = [];
  let buffer = Buffer.alloc(0);
  input.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    const { messages, remaining } = decodeMessages(buffer);
    buffer = remaining;
    for (const msg of messages) {
      for (const listener of listeners) {
        listener(msg);
      }
    }
  });
  return {
    send(msg) {
      output.write(encodeMessage(msg));
    },
    onMessage(listener) {
      listeners.push(listener);
    }
  };
}

export {
  SessionManager,
  CommandQueue,
  ActivityBlockStack,
  ExtensionDriver,
  encodeMessage,
  decodeMessages,
  createNativeMessagingTransport
};
//# sourceMappingURL=chunk-5ZGCGCEK.js.map