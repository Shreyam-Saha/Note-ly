process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("dotenv").config();
const http = require("http");
const WebSocket = require("ws");
const { Server } = require("@hocuspocus/server");
const { TiptapTransformer } = require("@hocuspocus/transformer");
const StarterKit = require("@tiptap/starter-kit").default;
const Image = require("@tiptap/extension-image").default;
const CodeBlock = require("@tiptap/extension-code-block").default;
const { startCleanupJob } = require("./src/jobs/cleanupOrphanedImages");

const app = require("./src/app");
const prisma = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// Create standard HTTP server wrapping Express
const server = http.createServer(app);

// Configure Hocuspocus Server
const hocuspocusServer = new Server({
  port: null, // Disable internal HTTP server
  async onLoadDocument(data) {
    const noteId = data.documentName;

    try {
      const note = await prisma.note.findUnique({
        where: { id: noteId },
      });

      if (!note || !note.content) {
        return data.document;
      }

      // If document is already loaded/in memory, we don't need to do anything
      if (data.document.isEmpty("default")) {
        const ydoc = TiptapTransformer.toYdoc(note.content, "default", [
          StarterKit.configure({ codeBlock: false, undoRedo: false }),
          Image,
          CodeBlock
        ]);
        
        // Merge the created ydoc into the existing one
        const Y = require("yjs");
        Y.applyUpdate(data.document, Y.encodeStateAsUpdate(ydoc));
      }

      return data.document;
    } catch (err) {
      console.error(`Error loading document ${noteId}:`, err);
      return data.document;
    }
  },

  async onStoreDocument(data) {
    const noteId = data.documentName;

    try {
      // Convert Yjs Document to JSON
      const json = TiptapTransformer.fromYdoc(data.document, "default");

      await prisma.note.update({
        where: { id: noteId },
        data: {
          content: json,
        },
      });

      console.log(`[Hocuspocus] Document ${noteId} saved to database.`);
    } catch (err) {
      console.error(`[Hocuspocus] Error storing document ${noteId}:`, err);
    }
  },
});

// Configure WebSocket Server attached to the same HTTP server
const wss = new WebSocket.Server({ server });

wss.on("connection", (socket, request) => {
  hocuspocusServer.hocuspocus.handleConnection(socket, request);
});

// Start the unified server
server.listen(PORT, () => {
  console.log(`Express API running on http://localhost:${PORT}`);
  console.log(`Hocuspocus WebSocket Server running on ws://localhost:${PORT}`);
  startCleanupJob();
});
