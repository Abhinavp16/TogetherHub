// Meeting rooms over Socket.IO: WebRTC signalling, media state and chat.
// Every socket must present a valid login token, may only join meetings for rooms it can
// access, and can only message or signal peers inside the meeting it has joined.
const mongoose = require('mongoose');
const Room = require('../models/Room');
const { getUserFromToken } = require('../utils/authHelpers');
const { canAccessRoom } = require('../utils/permissions');

const MAX_CHAT_LENGTH = 2000;

const registerMeetingHandlers = (io) => {
    const meetingRooms = new Map(); // roomId -> Set(socketId)
    const meetingSocketRoom = new Map(); // socketId -> roomId
    const meetingMicStatus = new Map();
    const meetingVideoStatus = new Map();

    io.use(async (socket, next) => {
        const user = await getUserFromToken(socket.handshake.auth?.token);
        if (!user) {
            return next(new Error('unauthorized'));
        }
        socket.data.user = {
            id: user._id.toString(),
            name: user.name,
            avatar: user.avatar,
            email: user.email,
            _id: user._id
        };
        next();
    });

    const profileOf = (socketId) => {
        const user = io.sockets.sockets.get(socketId)?.data.user || {};
        return { id: user.id, name: user.name, avatar: user.avatar };
    };

    const getMeetingUsers = (roomId) => {
        if (!meetingRooms.has(roomId)) {
            return [];
        }

        return Array.from(meetingRooms.get(roomId)).map((socketId) => ({
            socketId,
            ...profileOf(socketId),
            micStatus: meetingMicStatus.get(socketId) || 'on',
            videoStatus: meetingVideoStatus.get(socketId) || 'on'
        }));
    };

    const inSameMeeting = (socketId, otherSocketId) => {
        const roomId = meetingSocketRoom.get(socketId);
        return Boolean(roomId) && meetingSocketRoom.get(otherSocketId) === roomId;
    };

    const leaveMeeting = (socket) => {
        const roomId = meetingSocketRoom.get(socket.id);

        if (roomId && meetingRooms.has(roomId)) {
            const peers = meetingRooms.get(roomId);
            peers.delete(socket.id);
            socket.leave(roomId);
            socket.to(roomId).emit('meeting-remove-peer', { peerId: socket.id });

            if (peers.size === 0) {
                meetingRooms.delete(roomId);
            } else {
                io.to(roomId).emit('meeting-users-update', getMeetingUsers(roomId));
            }
        }

        meetingSocketRoom.delete(socket.id);
        meetingMicStatus.delete(socket.id);
        meetingVideoStatus.delete(socket.id);
    };

    io.on('connection', (socket) => {
        socket.on('meeting-join-room', async ({ roomId } = {}) => {
            try {
                if (!mongoose.isValidObjectId(roomId)) {
                    return socket.emit('meeting-error', { message: 'Meeting not found' });
                }

                const room = await Room.findById(roomId);
                if (!room || room.type !== 'video') {
                    return socket.emit('meeting-error', { message: 'Meeting not found' });
                }
                if (!canAccessRoom(room, socket.data.user)) {
                    return socket.emit('meeting-error', { message: 'You do not have access to this meeting' });
                }

                if (meetingSocketRoom.has(socket.id)) {
                    leaveMeeting(socket);
                }

                socket.join(roomId);
                meetingSocketRoom.set(socket.id, roomId);
                meetingMicStatus.set(socket.id, 'on');
                meetingVideoStatus.set(socket.id, 'on');

                if (!meetingRooms.has(roomId)) {
                    meetingRooms.set(roomId, new Set());
                }

                const existingPeers = Array.from(meetingRooms.get(roomId));
                meetingRooms.get(roomId).add(socket.id);

                const peerDetails = existingPeers.reduce((acc, peerId) => {
                    acc[peerId] = {
                        ...profileOf(peerId),
                        micStatus: meetingMicStatus.get(peerId) || 'on',
                        videoStatus: meetingVideoStatus.get(peerId) || 'on'
                    };
                    return acc;
                }, {});

                socket.emit('meeting-room-joined', {
                    peers: existingPeers,
                    peerDetails,
                    selfId: socket.id
                });

                io.to(roomId).emit('meeting-users-update', getMeetingUsers(roomId));
            } catch (error) {
                socket.emit('meeting-error', { message: 'Unable to join the meeting' });
            }
        });

        socket.on('meeting-offer', ({ offer, targetPeerId } = {}) => {
            if (!inSameMeeting(socket.id, targetPeerId)) return;

            socket.to(targetPeerId).emit('meeting-offer', {
                offer,
                fromPeerId: socket.id,
                user: profileOf(socket.id),
                micStatus: meetingMicStatus.get(socket.id) || 'on',
                videoStatus: meetingVideoStatus.get(socket.id) || 'on'
            });
        });

        socket.on('meeting-answer', ({ answer, targetPeerId } = {}) => {
            if (!inSameMeeting(socket.id, targetPeerId)) return;

            socket.to(targetPeerId).emit('meeting-answer', {
                answer,
                fromPeerId: socket.id
            });
        });

        socket.on('meeting-ice-candidate', ({ candidate, targetPeerId } = {}) => {
            if (!inSameMeeting(socket.id, targetPeerId)) return;

            socket.to(targetPeerId).emit('meeting-ice-candidate', {
                candidate,
                fromPeerId: socket.id
            });
        });

        socket.on('meeting-action', ({ action } = {}) => {
            const roomId = meetingSocketRoom.get(socket.id);
            if (!roomId) return;

            if (action === 'mute') {
                meetingMicStatus.set(socket.id, 'off');
            } else if (action === 'unmute') {
                meetingMicStatus.set(socket.id, 'on');
            } else if (action === 'videooff') {
                meetingVideoStatus.set(socket.id, 'off');
            } else if (action === 'videoon') {
                meetingVideoStatus.set(socket.id, 'on');
            } else {
                return;
            }

            socket.to(roomId).emit('meeting-action', {
                action,
                peerId: socket.id
            });
            io.to(roomId).emit('meeting-users-update', getMeetingUsers(roomId));
        });

        socket.on('meeting-chat-message', ({ roomId, message } = {}) => {
            // Only participants of this meeting may post, and the sender is always the authenticated user.
            if (!roomId || meetingSocketRoom.get(socket.id) !== roomId) return;
            if (typeof message !== 'string') return;

            const text = message.trim().slice(0, MAX_CHAT_LENGTH);
            if (!text) return;

            const { id, name } = socket.data.user;
            io.to(roomId).emit('meeting-chat-message', {
                id: `${socket.id}-${Date.now()}`,
                message: text,
                sender: { id, name },
                timestamp: new Date().toISOString()
            });
        });

        socket.on('meeting-leave', () => leaveMeeting(socket));

        socket.on('disconnect', () => leaveMeeting(socket));
    });
};

module.exports = { registerMeetingHandlers };
