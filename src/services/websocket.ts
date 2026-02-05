
import { FastifyRequest } from "fastify";
import { WebSocket } from "ws";

// Store active connections
const clients = new Set<WebSocket>();

export function handleWebsocketConnection(connection: any, req: FastifyRequest) {
    // In some versions/configs, connection might be the socket itself or a stream
    const socket = (connection.socket || connection) as WebSocket;

    if (!socket || typeof socket.on !== 'function') {
        console.error("❌ Invalid Websocket connection object received.");
        return;
    }
    console.log("🔌 New Websocket Client Connected");
    clients.add(socket);

    socket.on("message", (message: any) => {
        // Optional: Handle incoming messages if needed in future
        try {
            if (message.toString() === 'ping') {
                socket.send('pong');
            }
        } catch (e) {
            console.error("Error handling message", e);
        }
    });

    socket.on("close", () => {
        // console.log("🔌 Websocket Client Disconnected");
        clients.delete(socket);
    });

    socket.on("error", (err: any) => {
        console.error("Websocket Error:", err);
        clients.delete(socket);
    });
}

export function broadcastGameResult(betId: string, result: any) {
    const message = JSON.stringify({
        type: "GAME_RESULT",
        betId,
        payload: result
    });

    // console.log(`📢 Broadcasting result for ${betId} to ${clients.size} clients`);

    for (const client of clients) {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(message);
        }
    }
}
