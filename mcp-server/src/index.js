import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  ExtensionDriver,
  createNativeMessagingTransport
} from "../chunk-5ZGCGCEK.js";
import {
  McpServer
} from "../chunk-D7MBH6AY.js";
import {
  registerAgruneTools
} from "../chunk-DDGCW5LN.js";
import "../chunk-WOQ5QXUZ.js";
import "../chunk-APXANOE3.js";
import "../chunk-J5GXOUVN.js";
import "../chunk-IGG3I32P.js";

// src/public-shapes.ts
function toPublicSession(session) {
  return {
    tabId: session.tabId,
    url: session.url,
    title: session.title || session.snapshot?.title || "",
    hasSnapshot: session.snapshot !== null,
    snapshotVersion: session.snapshot?.version ?? null
  };
}
function toPublicTarget(target, includeTextContent) {
  return {
    targetId: target.targetId,
    groupId: target.groupId,
    name: target.name,
    description: target.description,
    actionKinds: target.actionKinds,
    ...target.reason !== "ready" ? { reason: target.reason } : {},
    ...target.sensitive ? { sensitive: true } : {},
    ...includeTextContent && target.textContent ? { textContent: target.textContent } : {},
    ...target.center ? { center: target.center } : {},
    ...target.size ? { size: target.size } : {},
    ...target.coordSpace ? { coordSpace: target.coordSpace } : {}
  };
}
function getActiveContext(snapshot) {
  const actionableTargets = snapshot.targets.filter((target) => target.actionableNow);
  const overlayTargets = actionableTargets.filter((target) => target.overlay);
  if (overlayTargets.length > 0) {
    return {
      context: "overlay",
      targets: overlayTargets
    };
  }
  return {
    context: "page",
    targets: actionableTargets
  };
}
function toPublicGroups(targets, snapshotGroups) {
  const metaMap = new Map(
    snapshotGroups.filter((g) => g.meta !== void 0).map((g) => [g.groupId, g.meta])
  );
  const groups = /* @__PURE__ */ new Map();
  for (const target of targets) {
    const existing = groups.get(target.groupId);
    if (existing) {
      existing.targets.push(target);
      continue;
    }
    groups.set(target.groupId, {
      groupId: target.groupId,
      groupName: target.groupName,
      groupDesc: target.groupDesc,
      targets: [target]
    });
  }
  return Array.from(groups.values()).map((group) => ({
    groupId: group.groupId,
    groupName: group.groupName,
    groupDesc: group.groupDesc,
    targetCount: group.targets.length,
    actionKinds: [...new Set(group.targets.flatMap((target) => target.actionKinds))],
    sampleTargetNames: group.targets.map((target) => target.name).filter((name) => name.length > 0).slice(0, 3),
    ...metaMap.has(group.groupId) ? { meta: metaMap.get(group.groupId) } : {}
  }));
}
function toPublicSnapshot(snapshot, options = {}) {
  const activeContext = getActiveContext(snapshot);
  const requestedGroupIds = new Set(options.groupIds ?? []);
  const includeTargets = requestedGroupIds.size > 0 || options.mode === "full";
  const expandedTargets = requestedGroupIds.size > 0 ? activeContext.targets.filter((target) => requestedGroupIds.has(target.groupId)) : activeContext.targets;
  return {
    version: snapshot.version,
    url: snapshot.url,
    title: snapshot.title,
    context: activeContext.context,
    ...requestedGroupIds.size === 0 ? { groups: toPublicGroups(activeContext.targets, snapshot.groups) } : {},
    ...includeTargets ? { targets: expandedTargets.map((t) => toPublicTarget(t, options.includeTextContent ?? false)) } : {}
  };
}
function toPublicCommandResult(result) {
  if (result.ok) {
    return {
      commandId: result.commandId,
      ok: true,
      ...result.result ? { result: result.result } : {}
    };
  }
  return {
    commandId: result.commandId,
    ok: false,
    error: result.error
  };
}

// src/tools.ts
function getToolDefinitions() {
  return [
    {
      name: "agrune_sessions",
      description: "List active browser sessions (tabs) being managed by agrune.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "agrune_snapshot",
      description: 'Get the current active-context snapshot for a browser tab. By default returns a group outline only; use groupId/groupIds or mode="full" to expand actionable targets. Targets only include actionable elements. Omitted fields use defaults: visible=true, enabled=true.',
      inputSchema: {
        type: "object",
        properties: {
          tabId: { type: "number", description: "Browser tab ID. Defaults to the first active session." },
          groupId: { type: "string", description: "Expand a single group by its groupId." },
          groupIds: {
            type: "array",
            items: { type: "string" },
            description: "Expand multiple groups by groupId."
          },
          mode: {
            type: "string",
            enum: ["outline", "full"],
            description: "outline returns groups only; full returns all actionable targets in the active context."
          },
          includeTextContent: {
            type: "boolean",
            description: "Include visible text content of each target element. Default: false."
          }
        }
      }
    },
    {
      name: "agrune_act",
      description: "Perform an interaction (click, dblclick, contextmenu, hover, longpress) on a target element. Defaults to click. A target may support multiple actions \u2014 check actionKinds in the snapshot.",
      inputSchema: {
        type: "object",
        properties: {
          tabId: { type: "number", description: "Browser tab ID. Defaults to the first active session." },
          targetId: { type: "string", description: "The target element ID from the page snapshot." },
          action: {
            type: "string",
            enum: ["click", "dblclick", "contextmenu", "hover", "longpress"],
            description: "Interaction type to perform on the target. Defaults to click."
          }
        },
        required: ["targetId"]
      }
    },
    {
      name: "agrune_fill",
      description: "Fill an input element with a value. The element is identified by its targetId from the page snapshot.",
      inputSchema: {
        type: "object",
        properties: {
          tabId: { type: "number", description: "Browser tab ID. Defaults to the first active session." },
          targetId: { type: "string", description: "The target input element ID from the page snapshot." },
          value: { type: "string", description: "The value to fill into the input element." }
        },
        required: ["targetId", "value"]
      }
    },
    {
      name: "agrune_drag",
      description: "Drag an element and drop it onto another element.",
      inputSchema: {
        type: "object",
        properties: {
          tabId: { type: "number", description: "Browser tab ID. Defaults to the first active session." },
          sourceTargetId: { type: "string", description: "The source element ID to drag." },
          destinationTargetId: { type: "string", description: "The destination element ID to drop onto." },
          placement: {
            type: "string",
            enum: ["before", "after", "inside"],
            description: "Drop placement relative to the destination element."
          }
        },
        required: ["sourceTargetId", "destinationTargetId"]
      }
    },
    {
      name: "agrune_wait",
      description: "Wait for a target element to reach a specific state (e.g., visible, hidden, enabled, disabled).",
      inputSchema: {
        type: "object",
        properties: {
          tabId: { type: "number", description: "Browser tab ID. Defaults to the first active session." },
          targetId: { type: "string", description: "The target element ID from the page snapshot." },
          state: {
            type: "string",
            enum: ["visible", "hidden", "enabled", "disabled"],
            description: "The state to wait for."
          },
          timeoutMs: { type: "number", description: "Timeout in milliseconds. Defaults to 30000." }
        },
        required: ["targetId", "state"]
      }
    },
    {
      name: "agrune_guide",
      description: "Visually highlight a target element on the page to guide the user.",
      inputSchema: {
        type: "object",
        properties: {
          tabId: { type: "number", description: "Browser tab ID. Defaults to the first active session." },
          targetId: { type: "string", description: "The target element ID to highlight." }
        },
        required: ["targetId"]
      }
    },
    {
      name: "agrune_config",
      description: "Update the page runtime configuration (pointer animation, aurora glow, etc.).",
      inputSchema: {
        type: "object",
        properties: {
          pointerAnimation: { type: "boolean", description: "Enable or disable pointer animation." },
          auroraGlow: { type: "boolean", description: "Enable or disable aurora glow effect." },
          auroraTheme: { type: "string", description: "Aurora glow theme name." },
          clickDelayMs: { type: "number", description: "Delay in milliseconds before click execution." },
          pointerDurationMs: { type: "number", description: "Pointer animation duration in milliseconds." },
          autoScroll: { type: "boolean", description: "Enable or disable automatic scrolling to target." }
        }
      }
    },
    {
      name: "agrune_read",
      description: "Extract visible page content as structured markdown.",
      inputSchema: {
        type: "object",
        properties: {
          tabId: { type: "number", description: "Browser tab ID. Defaults to the first active session." },
          selector: { type: "string", description: "CSS selector to scope extraction. Defaults to document.body." }
        }
      }
    }
  ];
}

// src/index.ts
function createMcpServer() {
  const driver = new ExtensionDriver();
  const mcp = new McpServer(
    { name: "agrune", version: true ? "0.4.1" : "0.0.0" },
    { capabilities: { tools: {} } }
  );
  const handleToolCall = async (name, args) => {
    driver.onActivity?.();
    if (name !== "agrune_config") {
      const readyError = await driver.ensureReady();
      if (readyError) return { text: readyError, isError: true };
    }
    const tabId = driver.resolveTabId(args.tabId);
    switch (name) {
      case "agrune_sessions": {
        const sessions = driver.sessions.getSessions();
        return { text: JSON.stringify(sessions.map(toPublicSession), null, 2) };
      }
      case "agrune_snapshot": {
        if (tabId == null) return { text: "No active sessions.", isError: true };
        const snapshot = driver.getSnapshot(tabId);
        if (!snapshot) return { text: `No snapshot available for tab ${tabId}.`, isError: true };
        return { text: JSON.stringify(toPublicSnapshot(snapshot, resolveSnapshotOptions(args)), null, 2) };
      }
      case "agrune_act":
      case "agrune_fill":
      case "agrune_drag":
      case "agrune_pointer":
      case "agrune_wait":
      case "agrune_guide":
      case "agrune_read": {
        if (tabId == null) return { text: "No active sessions.", isError: true };
        const command = {
          kind: name.replace("agrune_", ""),
          ...args
        };
        delete command.tabId;
        const result = await driver.execute(tabId, command);
        return { text: JSON.stringify(toPublicCommandResult(result), null, 2) };
      }
      case "agrune_config": {
        const config = {};
        if (typeof args.pointerAnimation === "boolean") config.pointerAnimation = args.pointerAnimation;
        if (typeof args.auroraGlow === "boolean") config.auroraGlow = args.auroraGlow;
        if (typeof args.auroraTheme === "string") config.auroraTheme = args.auroraTheme;
        if (typeof args.clickDelayMs === "number") config.clickDelayMs = args.clickDelayMs;
        if (typeof args.pointerDurationMs === "number") config.pointerDurationMs = args.pointerDurationMs;
        if (typeof args.autoScroll === "boolean") config.autoScroll = args.autoScroll;
        if (Object.keys(config).length > 0) driver.sendRaw({ type: "config_update", config });
        return { text: "Configuration updated." };
      }
      default:
        return { text: `Unknown tool: ${name}`, isError: true };
    }
  };
  registerAgruneTools(mcp, handleToolCall);
  function connectNativeMessaging(input, output) {
    const transport = createNativeMessagingTransport(input, output);
    driver.setNativeSender(transport.send);
    transport.onMessage((msg) => driver.handleNativeMessage(msg));
    return transport;
  }
  return { server: mcp, driver, handleToolCall, connectNativeMessaging };
}
function resolveSnapshotOptions(args) {
  const groupIds = /* @__PURE__ */ new Set();
  if (typeof args.groupId === "string" && args.groupId.trim()) groupIds.add(args.groupId.trim());
  if (Array.isArray(args.groupIds)) {
    for (const value of args.groupIds) {
      if (typeof value === "string" && value.trim()) groupIds.add(value.trim());
    }
  }
  return {
    mode: args.mode === "full" ? "full" : "outline",
    ...groupIds.size > 0 ? { groupIds: [...groupIds] } : {},
    ...args.includeTextContent === true ? { includeTextContent: true } : {}
  };
}
export {
  ExtensionDriver,
  createMcpServer,
  createNativeMessagingTransport,
  getToolDefinitions,
  registerAgruneTools
};
//# sourceMappingURL=index.js.map