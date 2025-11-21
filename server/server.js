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

  socket.on('join_room', (data) => {
    console.log('join_room received data:', data);
    let roomId;
    let playerName = 'Unknown';

    if (typeof data === 'string') {
      roomId = data;
    } else if (typeof data === 'object' && data !== null) {
      roomId = data.roomId;
      playerName = data.name || 'Unknown';
    }

    if (!roomId) {
      console.error('Invalid roomId received:', roomId);
      return;
    }

    socket.join(roomId);
    console.log(`User ${playerName} (${socket.id}) joined room ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    // Initialize player state
    // Check if player already exists (respawn) to persist kills
    let existingKills = 0;
    if (rooms.get(roomId).has(socket.id)) {
      existingKills = rooms.get(roomId).get(socket.id).kills || 0;
    }

    rooms.get(roomId).set(socket.id, {
      id: socket.id,
      name: playerName,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      health: 100,
      weapon: 'pistol',
      kills: existingKills
    });

    // Notify others in the room
    socket.to(roomId).emit('player_joined', { id: socket.id, name: playerName });

    // Send existing players to the new player
    const existingPlayers = Array.from(rooms.get(roomId).entries())
      .filter(([id]) => id !== socket.id)
      .map(([id, state]) => state);

    socket.emit('current_players', existingPlayers);

    // Send welcome message with own state (to sync kills on respawn)
    socket.emit('welcome', {
      id: socket.id,
      kills: existingKills
    });
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
    const { roomId, targetId, damage, attackerId } = data;
    console.log(`Player ${attackerId} hit ${targetId} for ${damage} damage`);
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

        // Resolve names
        const victimName = targetPlayer.name || 'Unknown';
        let killerName = 'Unknown';
        if (attackerId && rooms.get(roomId).has(attackerId)) {
          const killer = rooms.get(roomId).get(attackerId);
          killerName = killer.name || 'Unknown';
          killer.kills = (killer.kills || 0) + 1;

          // Notify everyone about killer's new kill count
          io.to(roomId).emit('player_update', {
            id: attackerId,
            kills: killer.kills
          });
        } else {
          console.log(`Attacker ${attackerId} not found in room ${roomId}`);
          console.log('Room players:', Array.from(rooms.get(roomId).keys()));
        }

        // Notify death
        console.log(`Player ${targetId} died. Killer: ${killerName}, Victim: ${victimName}`);
        console.log('Emitting player_died with data:', {
          id: targetId,
          position: targetPlayer.position,
          killerName,
          victimName
        });

        io.to(roomId).emit('player_died', {
          id: targetId,
          position: targetPlayer.position,
          killerName,
          victimName
        });

        // Remove player from room state so they don't get synced anymore
        // But keep socket connection for now so they can receive game over state if needed?
        // Actually, let's just remove them from the map.
        // FIX: Do NOT remove player from room state so they stay on leaderboard
        // rooms.get(roomId).delete(targetId);
      }
    }
  });

  socket.on('disconnect', () => {
    // Find which room the player was in
    for (const [roomId, players] of rooms.entries()) {
      if (players.has(socket.id)) {
        const player = players.get(socket.id);
        const playerName = player.name || 'Unknown';
        console.log(`User ${playerName} (${socket.id}) disconnected`);
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
