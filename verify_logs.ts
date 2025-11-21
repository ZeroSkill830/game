import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('join_room', { roomId: 'test-room', name: 'TestPlayer' });

    setTimeout(() => {
        console.log('Disconnecting...');
        socket.disconnect();
    }, 1000);
});
