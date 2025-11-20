import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now
    methods: ["GET", "POST"]
  }
});

// Store room state
// roomID -> { playerID -> PlayerState }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    // Initialize player state
    rooms.get(roomId).set(socket.id, {
      id: socket.id,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      health: 100,
      weapon: 'pistol'
    });

    // Notify others in the room
    socket.to(roomId).emit('player_joined', socket.id);

    // Send existing players to the new player
    const existingPlayers = Array.from(rooms.get(roomId).entries())
      .filter(([id]) => id !== socket.id)
      .map(([id, state]) => state);

    socket.emit('current_players', existingPlayers);
  });

  socket.on('player_update', (data) => {
    // data: { roomId, position, rotation, ... }
    const { roomId, ...state } = data;
    if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
      const player = rooms.get(roomId).get(socket.id);
      Object.assign(player, state);

      // Broadcast update to others in the room
      // Using volatile for high-frequency updates to avoid buffering
      socket.to(roomId).volatile.emit('player_update', {
        id: socket.id,
        ...state
      });
    }
  });

  socket.on('player_action', (data) => {
    // data: { roomId, type, ...args }
    const { roomId, type, ...args } = data;
    socket.to(roomId).emit('player_action', {
      id: socket.id,
      type,
      ...args
    });
  });

  socket.on('player_hit', (data) => {
    const { roomId, targetId, damage } = data;
    if (rooms.has(roomId) && rooms.get(roomId).has(targetId)) {
      const targetPlayer = rooms.get(roomId).get(targetId);
      targetPlayer.health -= damage;

      // Notify everyone in room about health update
      io.to(roomId).emit('player_update', {
        id: targetId,
        health: targetPlayer.health
      });

      // If dead
      if (targetPlayer.health <= 0) {
        targetPlayer.health = 0;

        // Notify death
        io.to(roomId).emit('player_died', {
          id: targetId,
          position: targetPlayer.position
        });

        // Remove player from room state so they don't get synced anymore
        // But keep socket connection for now so they can receive game over state if needed?
        // Actually, let's just remove them from the map.
        rooms.get(roomId).delete(targetId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Find which room the player was in
    for (const [roomId, players] of rooms.entries()) {
      if (players.has(socket.id)) {
        players.delete(socket.id);
        io.to(roomId).emit('player_left', socket.id);
        if (players.size === 0) {
          rooms.delete(roomId);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
