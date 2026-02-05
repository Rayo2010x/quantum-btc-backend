
import WebSocket from 'ws';

function testWebsocket() {
    console.log("Connecting to websocket...");
    const ws = new WebSocket('ws://localhost:3000/ws');

    ws.on('open', () => {
        console.log('✅ Connected to Websocket!');
        ws.send('ping');
    });

    ws.on('message', (data) => {
        console.log('📩 Received message:', data.toString());
        if (data.toString() === 'pong') {
            console.log('✅ Ping/Pong successful');
            process.exit(0);
        }
    });

    ws.on('error', (err) => {
        console.error('❌ Websocket Error:', err);
        process.exit(1);
    });

    setTimeout(() => {
        console.error("❌ Timeout waiting for response");
        process.exit(1);
    }, 5000);
}

testWebsocket();
