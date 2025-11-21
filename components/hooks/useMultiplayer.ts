import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore, RemotePlayerState } from '../../store';

const SERVER_URL = 'https://game-x7nt.onrender.com';
// const SERVER_URL = 'http://localhost:3001';

let socketInstance: Socket | null = null;

export function useMultiplayer() {
    const {
        roomId,
        setPlayerId,
        updateRemotePlayer,
        removeRemotePlayer,
        setRoomId,
        isPlaying
    } = useGameStore();

    useEffect(() => {
        // Connect to server only if not already connected
        if (!socketInstance) {
            socketInstance = io(SERVER_URL);

            const socket = socketInstance;

            socket.on('connect', () => {
                console.log('Connected to server:', socket.id);
                if (socket.id) {
                    setPlayerId(socket.id);
                }
            });

            socket.on('player_joined', (id: string) => {
                console.log('Player joined:', id);
                updateRemotePlayer(id, {});
            });

            socket.on('current_players', (players: RemotePlayerState[]) => {
                players.forEach(player => {
                    updateRemotePlayer(player.id, player);
                });
            });

            socket.on('player_update', (data: RemotePlayerState) => {
                if (data.id === socket.id) {
                    // Update local player
                    useGameStore.setState((state) => {
                        const updates: any = {};
                        if (data.health !== undefined) updates.health = data.health;
                        return updates;
                    });
                } else {
                    updateRemotePlayer(data.id, data);
                }
            });

            socket.on('player_died', (data: { id: string, position: [number, number, number] }) => {
                if (data.id === socket.id) {
                    // Local player died
                    useGameStore.getState().endGame();
                } else {
                    // Remote player died
                    removeRemotePlayer(data.id);
                    useGameStore.getState().addTombstone({
                        id: data.id,
                        position: data.position
                    });
                }
            });

            socket.on('player_left', (id: string) => {
                console.log('Player left:', id);
                removeRemotePlayer(id);
            });
        }

        // We don't disconnect on unmount anymore to allow multiple components to use the hook
        // Cleanup should happen when the app closes or explicitly if needed.
        // For now, we rely on the singleton.

    }, []);

    // Join room when roomId is set or game restarts
    useEffect(() => {
        if (roomId && socketInstance) {
            const join = () => {
                console.log('Joining room:', roomId);
                socketInstance?.emit('join_room', roomId);
                // Send initial name
                const { playerName } = useGameStore.getState();
                socketInstance?.emit('player_update', {
                    roomId,
                    name: playerName
                });
            };

            if (socketInstance.connected) {
                join();
            } else {
                socketInstance.on('connect', join);
            }
        }
    }, [roomId, isPlaying]);

    // Helper to send updates
    const sendUpdate = (data: Partial<RemotePlayerState>) => {
        if (socketInstance && roomId) {
            socketInstance.emit('player_update', {
                roomId,
                ...data
            });
        }
    };

    const sendAction = (type: string, ...args: any[]) => {
        if (socketInstance && roomId) {
            socketInstance.emit('player_action', {
                roomId,
                type,
                ...args
            });
        }
    };

    const sendHit = (targetId: string, damage: number) => {
        if (socketInstance && roomId) {
            socketInstance.emit('player_hit', {
                roomId,
                targetId,
                damage
            });
        }
    };

    return {
        sendUpdate,
        sendAction,
        sendHit
    };
}
