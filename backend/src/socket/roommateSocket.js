const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const RoommateRequest = require("../models/roommateRequest.model");

const roomForUser = (userId) => `user:${userId}`;
const chatRoom = (left, right) => `chat:${[String(left), String(right)].sort().join(":")}`;
const onlineUsers = new Set();
const lastSeen = new Map();

async function publishPresence(io, userId, isOnline, seenAt = null) {
  const [currentUser, requests] = await Promise.all([
    User.findById(userId).select("roommatePreferences.blockedUsers").lean(),
    RoommateRequest.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    }).select("from to").lean(),
  ]);
  const blockedIds = currentUser?.roommatePreferences?.blockedUsers || [];
  const otherIds = [...new Set(requests.map((request) =>
    String(request.from) === String(userId) ? String(request.to) : String(request.from)
  ))].filter((id) => !blockedIds.some((blockedId) => String(blockedId) === id));
  const recipients = await User.find({
    _id: { $in: otherIds },
    role: "user",
    "roommatePreferences.blockedUsers": { $ne: userId },
  }).select("_id").lean();
  for (const recipient of recipients) {
    io.to(roomForUser(recipient._id)).emit("roommate:presence", {
      userId,
      online: isOnline,
      lastSeen: seenAt,
    });
  }
}

async function canChat(userId, otherId) {
  if (!userId || !otherId || String(userId) === String(otherId)) return false;
  const [request, sender, recipient] = await Promise.all([
    RoommateRequest.exists({
      status: "accepted",
      $or: [
        { from: userId, to: otherId },
        { from: otherId, to: userId },
      ],
    }),
    User.findById(userId).select("roommatePreferences.blockedUsers").lean(),
    User.findById(otherId).select("roommatePreferences.blockedUsers").lean(),
  ]);
  const senderBlocked = (sender?.roommatePreferences?.blockedUsers || []).some((id) => String(id) === String(otherId));
  const recipientBlocked = (recipient?.roommatePreferences?.blockedUsers || []).some((id) => String(id) === String(userId));
  return Boolean(request && sender && recipient && !senderBlocked && !recipientBlocked);
}

function createRoommateSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowed = !origin ||
          origin.includes("localhost") ||
          origin.includes("192.168.") ||
          origin.includes("100.115.") ||
          origin.includes("ngrok") ||
          origin.includes("vercel.app") ||
          origin.includes("roomslider.in");
        callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role && decoded.role !== "user") return next(new Error("Roommate chat is for user accounts"));
      const user = await User.findById(decoded.id).select("_id role").lean();
      if (!user || user.role !== "user") return next(new Error("User account not found"));
      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(roomForUser(userId));
    onlineUsers.add(userId);
    lastSeen.delete(userId);
    publishPresence(io, userId, true).catch((error) => console.error("ROOMMATE ONLINE STATUS ERROR:", error));

    socket.on("roommate:join", async ({ userId: otherId } = {}, acknowledge = () => {}) => {
      try {
        if (!(await canChat(userId, otherId))) {
          acknowledge({ success: false });
          return;
        }
        const room = chatRoom(userId, otherId);
        socket.join(room);
        socket.data.allowedChats = socket.data.allowedChats || new Set();
        socket.data.allowedChats.add(String(otherId));
        acknowledge({
          success: true,
          online: onlineUsers.has(String(otherId)),
          lastSeen: lastSeen.get(String(otherId)) || null,
        });
      } catch (error) {
        console.error("ROOMMATE SOCKET JOIN ERROR:", error);
        acknowledge({ success: false });
      }
    });

    socket.on("roommate:typing", ({ userId: otherId, isTyping } = {}) => {
      if (!socket.data.allowedChats?.has(String(otherId))) return;
      io.to(roomForUser(otherId)).emit("roommate:typing", {
        userId,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on("disconnect", () => {
      if (io.sockets.adapter.rooms.get(roomForUser(userId))?.size) return;
      onlineUsers.delete(userId);
      const seenAt = new Date().toISOString();
      lastSeen.set(userId, seenAt);
      publishPresence(io, userId, false, seenAt)
        .catch((error) => console.error("ROOMMATE LAST SEEN STATUS ERROR:", error));
    });
  });

  return io;
}

module.exports = createRoommateSocket;
