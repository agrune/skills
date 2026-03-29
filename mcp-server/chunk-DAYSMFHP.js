import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  external_exports
} from "./chunk-J5GXOUVN.js";

// src/mcp-tools.ts
function toMcpToolResult(result) {
  return {
    content: [{ type: "text", text: result.text }],
    ...result.isError ? { isError: true } : {}
  };
}
function registerAgagruneTools(mcp, handleToolCall) {
  const optionalTabId = {
    tabId: external_exports.number().optional().describe("Tab ID (omit for active tab)")
  };
  mcp.tool(
    "agrune_sessions",
    "List active browser sessions (tabs). Only call this when switching between multiple tabs. agrune_snapshot automatically uses the active tab.",
    {},
    async () => toMcpToolResult(await handleToolCall("agrune_sessions", {}))
  );
  mcp.tool(
    "agrune_snapshot",
    "Get page snapshot with actionable targets. Calling with outline mode (default) returns a group summary. To get targetIds for a specific group, specify groupId to expand it. To get all targets at once, use mode=full. Do not re-snapshot after actions \u2014 one snapshot per task is enough. Defaults: reason=ready, sensitive=false.",
    {
      groupId: external_exports.string().optional().describe("Expand a group to get its targetIds"),
      groupIds: external_exports.array(external_exports.string()).optional().describe("Expand multiple groups"),
      mode: external_exports.enum(["outline", "full"]).optional().describe("outline (default): group summary; full: all targets"),
      includeTextContent: external_exports.boolean().optional().describe("Include text content"),
      ...optionalTabId
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_snapshot", args))
  );
  mcp.tool(
    "agrune_act",
    "Perform an interaction (click, dblclick, contextmenu, hover, longpress) on a target element by targetId. Defaults to click. When ok:true is returned, do not re-snapshot to verify.",
    {
      targetId: external_exports.string().describe("Target ID"),
      action: external_exports.enum(["click", "dblclick", "contextmenu", "hover", "longpress"]).optional().describe("Interaction type (default: click)"),
      ...optionalTabId
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_act", args))
  );
  mcp.tool(
    "agrune_fill",
    "Fill an input/textarea with a value by targetId. When ok:true is returned, do not re-snapshot to verify.",
    {
      targetId: external_exports.string().describe("Target ID"),
      value: external_exports.string().describe("Value to fill"),
      ...optionalTabId
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_fill", args))
  );
  mcp.tool(
    "agrune_drag",
    "Drag a source target to a destination. Use destinationTargetId for target-to-target drag, or destinationCoords for coordinate-based placement. For canvas groups, coords are in canvas space (auto-converted). Use relativeTo to position relative to another target. Returns movedTarget with final position.",
    {
      sourceTargetId: external_exports.string().describe("Source target ID"),
      destinationTargetId: external_exports.string().optional().describe("Destination target ID"),
      destinationCoords: external_exports.union([
        external_exports.object({
          x: external_exports.number().describe("X coordinate (canvas space for canvas groups)"),
          y: external_exports.number().describe("Y coordinate")
        }),
        external_exports.object({
          relativeTo: external_exports.string().describe("Reference target ID"),
          dx: external_exports.number().describe("X offset from reference target center"),
          dy: external_exports.number().describe("Y offset from reference target center")
        })
      ]).optional().describe("Destination: absolute coords or relative to another target"),
      placement: external_exports.enum(["before", "inside", "after"]).optional().describe("Drop placement (only with destinationTargetId)"),
      ...optionalTabId
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_drag", args))
  );
  mcp.tool(
    "agrune_pointer",
    "Execute a low-level pointer/wheel event sequence on an element. Use for canvas pan, zoom, freeform drawing, or any interaction requiring raw coordinates. Specify target element via targetId, selector, or coords (priority: targetId > selector > coords).",
    {
      targetId: external_exports.string().optional().describe("Annotated target ID"),
      selector: external_exports.string().optional().describe("CSS selector for target element"),
      coords: external_exports.object({
        x: external_exports.number().describe("Viewport X coordinate"),
        y: external_exports.number().describe("Viewport Y coordinate")
      }).optional().describe("Viewport coordinates to find element via elementFromPoint"),
      actions: external_exports.array(external_exports.discriminatedUnion("type", [
        external_exports.object({
          type: external_exports.literal("pointerdown"),
          x: external_exports.number().describe("Viewport X"),
          y: external_exports.number().describe("Viewport Y"),
          delayMs: external_exports.number().optional().describe("Delay in ms after this action")
        }),
        external_exports.object({
          type: external_exports.literal("pointermove"),
          x: external_exports.number().describe("Viewport X"),
          y: external_exports.number().describe("Viewport Y"),
          delayMs: external_exports.number().optional().describe("Delay in ms after this action")
        }),
        external_exports.object({
          type: external_exports.literal("pointerup"),
          x: external_exports.number().describe("Viewport X"),
          y: external_exports.number().describe("Viewport Y"),
          delayMs: external_exports.number().optional().describe("Delay in ms after this action")
        }),
        external_exports.object({
          type: external_exports.literal("wheel"),
          x: external_exports.number().describe("Viewport X"),
          y: external_exports.number().describe("Viewport Y"),
          deltaY: external_exports.number().describe("Scroll delta (negative = zoom in)"),
          ctrlKey: external_exports.boolean().optional().describe("Hold Ctrl (for pinch-zoom)"),
          delayMs: external_exports.number().optional().describe("Delay in ms after this action"),
          steps: external_exports.number().int().min(1).optional().describe("Split deltaY into N equal steps for smooth zoom"),
          durationMs: external_exports.number().optional().describe("Total duration across all steps in ms")
        })
      ])).describe("Ordered sequence of pointer/wheel events"),
      ...optionalTabId
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_pointer", args))
  );
  mcp.tool(
    "agrune_wait",
    "Wait for target state change.",
    {
      targetId: external_exports.string().describe("Target ID"),
      state: external_exports.enum(["visible", "hidden", "enabled", "disabled"]).describe("Desired state"),
      timeoutMs: external_exports.number().optional().describe("Timeout ms (default: 10000)"),
      ...optionalTabId
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_wait", args))
  );
  mcp.tool(
    "agrune_guide",
    "Highlight a target visually.",
    {
      targetId: external_exports.string().describe("Target ID"),
      ...optionalTabId
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_guide", args))
  );
  mcp.tool(
    "agrune_config",
    "Update visual config. Only call when user explicitly requests.",
    {
      pointerAnimation: external_exports.boolean().optional(),
      auroraGlow: external_exports.boolean().optional(),
      auroraTheme: external_exports.enum(["dark", "light"]).optional(),
      clickDelayMs: external_exports.number().optional(),
      pointerDurationMs: external_exports.number().optional(),
      autoScroll: external_exports.boolean().optional(),
      agentActive: external_exports.boolean().optional().describe("Toggle agent visual presence")
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_config", args))
  );
  mcp.tool(
    "agrune_read",
    "Extract visible page content as structured markdown. Use selector to scope extraction to a specific area.",
    {
      selector: external_exports.string().optional().describe("CSS selector to scope extraction (default: full page)"),
      ...optionalTabId
    },
    async (args) => toMcpToolResult(await handleToolCall("agrune_read", args))
  );
}

export {
  toMcpToolResult,
  registerAgagruneTools
};
//# sourceMappingURL=chunk-DAYSMFHP.js.map