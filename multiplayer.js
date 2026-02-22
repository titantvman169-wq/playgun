// Multiplayer via Supabase Realtime Broadcast + Presence
(function () {
  'use strict';

  let supabase = null;
  let channel = null;
  let myPlayerId = null;
  let roomCode = null;
  let isHost = false;
  let playerName = '';
  const listeners = {};

  function id() {
    return Math.random().toString(36).slice(2, 10);
  }

  function code() {
    let s = '';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  window.Multiplayer = {
    isConfigured() {
      return !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.SUPABASE_URL.indexOf('your-project') === -1);
    },

    init() {
      if (!this.isConfigured()) return false;
      if (supabase) return true;
      try {
        supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        return true;
      } catch (e) {
        console.warn('Supabase init failed', e);
        return false;
      }
    },

    createRoom(name) {
      if (!this.init()) return Promise.reject(new Error('Supabase not configured'));
      myPlayerId = id();
      roomCode = code();
      playerName = name || 'Player 1';
      isHost = true;
      const ch = supabase.channel('room-' + roomCode, {
        config: { broadcast: { self: true } },
      });
      ch.track({ playerId: myPlayerId, name: playerName, isHost: true });
      ch.on('broadcast', { event: '*' }, (payload) => {
        const ev = payload.payload?.event || payload.event;
        const data = payload.payload?.data ?? payload.payload;
        if (listeners[ev]) listeners[ev].forEach((cb) => cb(data));
        if (listeners['*']) listeners['*'].forEach((cb) => cb(ev, data));
      });
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel = ch;
          this.broadcast('join', { playerId: myPlayerId, name: playerName, isHost: true });
        }
      });
      return Promise.resolve({ code: roomCode, playerId: myPlayerId, isHost: true });
    },

    joinRoom(joinCode, name) {
      if (!this.init()) return Promise.reject(new Error('Supabase not configured'));
      myPlayerId = id();
      roomCode = joinCode.toUpperCase().trim();
      playerName = name || 'Player 2';
      isHost = false;
      const ch = supabase.channel('room-' + roomCode, {
        config: { broadcast: { self: true } },
      });
      ch.track({ playerId: myPlayerId, name: playerName, isHost: false });
      ch.on('broadcast', { event: '*' }, (payload) => {
        const ev = payload.payload?.event || payload.event;
        const data = payload.payload?.data ?? payload.payload;
        if (listeners[ev]) listeners[ev].forEach((cb) => cb(data));
        if (listeners['*']) listeners['*'].forEach((cb) => cb(ev, data));
      });
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel = ch;
          this.broadcast('join', { playerId: myPlayerId, name: playerName, isHost: false });
        }
      });
      return Promise.resolve({ code: roomCode, playerId: myPlayerId, isHost: false });
    },

    leaveRoom() {
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
        channel = null;
      }
      myPlayerId = null;
      roomCode = null;
      isHost = false;
    },

    broadcast(event, data) {
      if (!channel) return;
      channel.send({
        type: 'broadcast',
        event,
        payload: { event, data: { ...data, from: myPlayerId } },
      });
    },

    on(event, callback) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },

    off(event, callback) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    },

    getPresence() {
      if (!channel) return [];
      const state = channel.presenceState();
      const list = [];
      Object.keys(state).forEach((key) => {
        state[key].forEach((p) => {
          list.push({ ...p, key });
        });
      });
      return list;
    },

    getMyPlayerId() { return myPlayerId; },
    getRoomCode() { return roomCode; },
    isHost() { return isHost; },
    getPlayerName() { return playerName; },
  };
})();
