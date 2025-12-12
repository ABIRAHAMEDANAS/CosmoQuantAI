import { useEffect, useRef, useState, useCallback } from 'react';

// WebSocket URL Configuration
// Adjust the port if necessary. In production this should be environment driven.
const WS_URL = 'ws://localhost:8000/ws/backtest';

interface SocketMessage {
    type: 'BACKTEST' | 'DOWNLOAD' | 'OPTIMIZE' | 'BATCH';
    task_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'Revoked' | 'REVOKED';
    progress: number;
    payload?: any;
    data?: any; // To support both payload and data keys just in case
}

export const useBacktestSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

    // Connection Logic
    const connect = useCallback(() => {
        // Prevent multiple connections
        if (socket?.readyState === WebSocket.OPEN) return;

        console.log("🔌 Connecting to Backtest WebSocket...");
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('✅ Backtest WS Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data: SocketMessage = JSON.parse(event.data);
                // Payload might be in 'data' or 'payload' key based on backend implementation
                // Our backend sends "data", but frontend spec had "payload". Let's normalize.
                if (data.data && !data.payload) {
                    data.payload = data.data;
                }
                setLastMessage(data);
            } catch (e) {
                console.error('WS Parse Error:', e);
            }
        };

        ws.onclose = () => {
            console.log('❌ Backtest WS Disconnected. Reconnecting in 3s...');
            setIsConnected(false);
            setSocket(null);

            // Clear existing timeout if any
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
            console.error("Backtest WS Error:", err);
            ws.close(); // Trigger onclose
        };

        setSocket(ws);
    }, [socket]); // socket dependency handles the check

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            socket?.close();
        };
    }, []); // Run once on mount

    return { isConnected, lastMessage };
};
