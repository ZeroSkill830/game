import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore, RemotePlayerState } from '../../store';

// const SERVER_URL = 'https://game-x7nt.onrender.com';
const SERVER_URL = 'http://localhost:3001';

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
                const { playerName } = useGameStore.getState();
                console.log(`Connected to server: ${playerName} (${socket.id})`);
                if (socket.id) {
                    setPlayerId(socket.id);
                }
            });

            socket.on('welcome', (data: { id: string, kills: number }) => {
                console.log('Welcome received:', data);
                useGameStore.setState({ kills: data.kills });
            });

            socket.on('player_joined', (data: { id: string, name: string } | string) => {
                let id: string;
                let name: string = 'Unknown';

                if (typeof data === 'string') {
                    id = data;
                } else {
                    id = data.id;
                    name = data.name || 'Unknown';
                }

                console.log(`Player joined: ${name} (${id})`);
                updateRemotePlayer(id, { name });
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
                        if (data.kills !== undefined) updates.kills = data.kills;
                        return updates;
                    });
                } else {
                    updateRemotePlayer(data.id, data);
                }
            });

            socket.on('player_died', (data: { id: string, position: [number, number, number], killerName?: string, victimName?: string }) => {
                console.log('Player died event received:', data);
                const { id, position, killerName, victimName } = data;

                if (killerName && victimName) {
                    useGameStore.getState().addKillFeedMessage(`${killerName} ha ucciso ${victimName}`);
                }

                if (id === socket.id) {
                    // Local player died
                    useGameStore.getState().endGame();
                } else {
                    // Remote player died
                    // removeRemotePlayer(id); // FIX: Keep player in store for leaderboard
                    useGameStore.getState().addTombstone({
                        id: `${id}-${Date.now()}`,
                        position
                    });
                }
            });

            socket.on('player_left', (id: string) => {
                const player = useGameStore.getState().otherPlayers[id];
                const name = player?.name || 'Unknown';
                console.log(`Player left: ${name} (${id})`);
                removeRemotePlayer(id);
            });
        }

        return () => {
            // Do not disconnect on unmount to keep connection alive across re-renders
            // if (socketInstance) {
            //     console.log('Disconnecting socket...');
            //     socketInstance.disconnect();
            //     socketInstance = null;
            // }
        };

    }, []);

    // Join room when roomId is set or game restarts
    useEffect(() => {
        if (roomId && socketInstance && isPlaying) {
            const join = () => {
                console.log('Joining room:', roomId);
                // Send initial name
                const { playerName } = useGameStore.getState();
                socketInstance?.emit('join_room', { roomId, name: playerName });

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
                damage,
                attackerId: socketInstance.id
            });
        }
    };

    return {
        sendUpdate,
        sendAction,
        sendHit
    };
}
