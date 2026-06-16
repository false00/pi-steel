import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { resolveSessionMode } from "./session-mode.js";
import { SteelClient } from "./steel-client.js";
import { clickTool } from "./tools/click.js";
import { computerTool } from "./tools/computer.js";
import { extractTool } from "./tools/extract.js";
import { findElementsTool } from "./tools/find-elements.js";
import { fillFormTool } from "./tools/fill-form.js";
import { getTitleTool, getUrlTool, goBackTool } from "./tools/navigation.js";
import { navigateTool } from "./tools/navigate.js";
import { pdfTool } from "./tools/pdf.js";
import { scrapeTool } from "./tools/scrape.js";
import { screenshotTool } from "./tools/screenshot.js";
import { scrollTool } from "./tools/scroll.js";
import { pinSessionTool, releaseSessionTool } from "./tools/session-control.js";
import { typeTool } from "./tools/type.js";
import { waitTool } from "./tools/wait.js";
export default function steelExtension(pi) {
    const steelClient = new SteelClient();
    const defaultSessionMode = resolveSessionMode();
    let sessionMode = defaultSessionMode;
    let closingSessions = null;
    const closeSessions = async (reason) => {
        if (!closingSessions) {
            closingSessions = (async () => {
                try {
                    await steelClient.closeAllSessions();
                }
                catch (error) {
                    // Cleanup failures should not break the main agent response path.
                    console.warn(`[steel] session cleanup failed (${reason})`, error);
                }
                finally {
                    closingSessions = null;
                }
            })();
        }
        await closingSessions;
    };
    const sessionController = {
        getDefaultSessionMode: () => defaultSessionMode,
        getSessionMode: () => sessionMode,
        setSessionMode: (mode) => {
            sessionMode = mode;
        },
        closeSessions,
    };
    const tools = [
        navigateTool(steelClient),
        scrapeTool(steelClient),
        screenshotTool(steelClient),
        pdfTool(steelClient),
        clickTool(steelClient),
        computerTool(steelClient),
        findElementsTool(steelClient),
        typeTool(steelClient),
        fillFormTool(steelClient),
        waitTool(steelClient),
        extractTool(steelClient),
        scrollTool(steelClient),
        goBackTool(steelClient),
        getUrlTool(steelClient),
        getTitleTool(steelClient),
        pinSessionTool(steelClient, sessionController),
        releaseSessionTool(steelClient, sessionController),
    ];
    for (const tool of tools) {
        pi.registerTool(tool);
    }
    const CACHE_DIRS = [
        path.join(os.homedir(), ".cache", ".steel-browser", "screenshots"),
        path.join(os.homedir(), ".cache", ".steel-browser", "scrapes"),
        path.join(os.homedir(), ".cache", ".steel-browser", "pdfs"),
    ];
    pi.registerCommand("clear_webcache", {
        description: "Delete all Steel browser artifacts (screenshots, scrapes, PDFs)",
        handler: async (_args, ctx) => {
            let deleted = 0;
            let errors = 0;
            for (const dir of CACHE_DIRS) {
                try {
                    const entries = await fs.readdir(dir);
                    await Promise.all(entries.map((entry) => fs.rm(path.join(dir, entry), { force: true, recursive: true })));
                    deleted += entries.length;
                }
                catch (err) {
                    if (err?.code !== "ENOENT") {
                        errors++;
                    }
                }
            }
            const msg = errors > 0
                ? `Cleared ${deleted} files (${errors} errors)`
                : `Cleared ${deleted} file(s)`;
            ctx.ui.notify(msg, "info");
        },
    });
    pi.on("turn_end", async () => {
        if (sessionMode === "turn") {
            await closeSessions("turn_end");
        }
    });
    pi.on("agent_end", async () => {
        if (sessionMode === "agent") {
            await closeSessions("agent_end");
        }
    });
    // Defensive cleanup for interactive session switches/forks.
    pi.on("session_before_switch", async () => {
        await closeSessions("session_before_switch");
    });
    pi.on("session_shutdown", async () => {
        await closeSessions("session_shutdown");
    });
    const shutdownApi = pi;
    shutdownApi.onShutdown?.(async () => {
        await closeSessions("onShutdown");
    });
}
//# sourceMappingURL=index.js.map