const mongoose = require("mongoose");
const RoommateProfile = require("../models/roommateProfile.model");
const RoommateRequest = require("../models/roommateRequest.model");
const RoommateReport = require("../models/roommateReport.model");
const RoommateMessage = require("../models/roommateMessage.model");
const User = require("../models/user.model");
const { notifyUser } = require("../utils/notificationDelivery");
const { sanitizeRoommatePreferences } = require("../utils/roommatePreferences");
const {
  migrateLegacyForUser,
  migrateLegacyProfiles,
} = require("../utils/migrateRoommateProfile");
const safeMsg = (error) =>
  process.env.NODE_ENV === "production" ? "Something went wrong" : error.message;

const markRoommateNotificationsRead = async (userId, { type, senderId, requestId } = {}) => {
  const filter = { user: userId, type, isRead: false, read: false };
  if (senderId) filter["data.senderId"] = String(senderId);
  if (requestId) filter["data.requestId"] = String(requestId);
  await require("../models/Notification").updateMany(filter, {
    $set: { isRead: true, read: true, readAt: new Date() },
  });
};

const isRegularUser = (req, res) => {
  if (req.user.role === "user") return true;
  res.status(403).json({ success: false, message: "Roommate Finder is for tenant accounts" });
  return false;
};

const publicRoommateProfile = (user) => {
  const preferences = user.roommatePreferences?.toObject?.() || user.roommatePreferences;
  if (!preferences) return null;
  const publicPreferences = { ...preferences };
  delete publicPreferences.blockedUsers;
  return {
        ...publicPreferences,
        bio: user.bio || "",
        city: user.city || "",
        area: user.area || "",
        college: user.organization || user.preferredCollege || "",
      };
};

const getMyProfile = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const user = await migrateLegacyForUser(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User nahi mila" });
    res.json({
      success: true,
      profile: publicRoommateProfile(user),
      account: {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        city: user.city,
        area: user.area,
        organization: user.organization,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const targetId = req.params.userId;
    if (!mongoose.isValidObjectId(targetId) || String(targetId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Invalid roommate profile" });
    }

    const viewer = await User.findById(req.user._id).select("roommatePreferences").lean();
    if (!viewer?.roommatePreferences?.setupComplete) {
      return res.status(403).json({ success: false, message: "Complete your roommate profile to view other profiles" });
    }
    const target = await User.findOne({
      _id: targetId,
      role: "user",
      "roommatePreferences.setupComplete": true,
      "roommatePreferences.active": true,
      "roommatePreferences.blockedUsers": { $ne: req.user._id },
    })
      .select("name username avatar bio city area organization preferredCollege occupation gender course subject studyYear roommatePreferences wishlist")
      .populate({
        path: "wishlist",
        select: "title price deposit location images category gender rooms bathrooms furnished amenities sharingType status",
        match: { status: "vacant" },
      })
      .lean();
    if (
      !target ||
      (viewer?.roommatePreferences?.blockedUsers || [])
        .some((id) => String(id) === String(targetId))
    ) {
      return res.status(404).json({ success: false, message: "Active roommate profile not found" });
    }

    const profile = publicRoommateProfile(target);
    res.json({
      success: true,
      profile: {
        id: String(target._id),
        name: target.name,
        username: target.username,
        avatar: target.avatar,
        gender: target.gender,
        occupation: target.occupation,
        organization: target.occupation === "student"
          ? target.organization || target.preferredCollege || ""
          : "",
        course: target.occupation === "student" ? target.course : "",
        subject: target.occupation === "student" ? target.subject : "",
        studyYear: target.occupation === "student" ? target.studyYear : "",
        ...profile,
      },
      savedRooms: (target.wishlist || []).filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getAcceptedConnection = async (currentUserId, otherUserId) => {
  const [request, currentUser, otherUser] = await Promise.all([
    RoommateRequest.exists({
      status: "accepted",
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId, to: currentUserId },
      ],
    }),
    User.findById(currentUserId).select("roommatePreferences.blockedUsers").lean(),
    User.findById(otherUserId).select("roommatePreferences.blockedUsers").lean(),
  ]);
  if (!request || !currentUser || !otherUser) return false;
  const currentBlocksOther = (currentUser.roommatePreferences?.blockedUsers || [])
    .some((id) => String(id) === String(otherUserId));
  const otherBlocksCurrent = (otherUser.roommatePreferences?.blockedUsers || [])
    .some((id) => String(id) === String(currentUserId));
  return !currentBlocksOther && !otherBlocksCurrent;
};

const getChatMessages = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const otherUserId = req.params.userId;
    if (!mongoose.isValidObjectId(otherUserId) || String(otherUserId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Invalid roommate connection" });
    }
    if (!(await getAcceptedConnection(req.user._id, otherUserId))) {
      return res.status(403).json({ success: false, message: "Accept the roommate request before starting a chat" });
    }

    const messages = await RoommateMessage.find({
      $or: [
        { from: req.user._id, to: otherUserId },
        { from: otherUserId, to: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    await RoommateMessage.updateMany(
      { from: otherUserId, to: req.user._id, readAt: null, isRead: { $ne: true } },
      { $set: { readAt: new Date(), isRead: true } }
    );
    try {
      await markRoommateNotificationsRead(req.user._id, { type: "roommate_message", senderId: otherUserId });
    } catch (error) {
      console.error("ROOMMATE MESSAGE NOTIFICATION READ ERROR:", error);
    }
    res.json({
      success: true,
      messages: messages.reverse().map((message) => ({
        id: String(message._id),
        from: String(message.from),
        body: message.body,
        createdAt: message.createdAt,
        readAt: message.readAt,
        isRead: Boolean(message.isRead || message.readAt),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const sendChatMessage = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const otherUserId = req.params.userId;
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!mongoose.isValidObjectId(otherUserId) || String(otherUserId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Invalid roommate connection" });
    }
    if (!body || body.length > 2000) {
      return res.status(400).json({ success: false, message: "Message must contain 1 to 2000 characters" });
    }
    if (!(await getAcceptedConnection(req.user._id, otherUserId))) {
      return res.status(403).json({ success: false, message: "Accept the roommate request before starting a chat" });
    }

    const message = await RoommateMessage.create({
      from: req.user._id,
      to: otherUserId,
      body,
    });
    try {
      await notifyUser(otherUserId, {
        type: "roommate_message",
        title: "New roommate message",
        body: "You received a new message.",
        link: `/roommates/chat/${req.user._id}`,
        data: { senderId: String(req.user._id), count: 1 },
      });
    } catch (error) {
      console.error("ROOMMATE MESSAGE NOTIFICATION ERROR:", error);
    }
    res.status(201).json({
      success: true,
      message: {
        id: String(message._id),
        from: String(message.from),
        body: message.body,
        createdAt: message.createdAt,
        readAt: message.readAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const input = { ...(req.body || {}) };
    delete input.blockedUsers;
    const { updates, error } = sanitizeRoommatePreferences(input);
    if (error) return res.status(400).json({ success: false, message: error });
    if (input.seeking !== undefined && input.city !== undefined && input.area !== undefined) {
      updates["roommatePreferences.setupComplete"] = true;
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ success: true, profile: publicRoommateProfile(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const compatibleSeeking = (mine, other) =>
  (mine === "both" || other === "both" || mine !== other);

const scoreMatch = (mine, other) => {
  let score = 0;
  if (mine.city && other.city && mine.city.toLowerCase() === other.city.toLowerCase()) score += 25;
  if (mine.area && other.area && mine.area.toLowerCase() === other.area.toLowerCase()) score += 25;
  if (mine.college && other.college && mine.college.toLowerCase() === other.college.toLowerCase()) score += 15;
  if (
    mine.budgetMax > 0 &&
    other.budgetMax > 0 &&
    mine.budgetMin <= other.budgetMax &&
    other.budgetMin <= mine.budgetMax
  ) score += 20;
  if (mine.sharingType && mine.sharingType === other.sharingType) score += 10;
  if (mine.moveInDate && other.moveInDate) {
    const days = Math.abs(mine.moveInDate - other.moveInDate) / 86400000;
    if (days <= 30) score += 5;
  }
  return score;
};

const getDiscover = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    await migrateLegacyProfiles();
    const user = await User.findById(req.user._id).lean();
    const mine = user?.roommatePreferences;
    const mineProfile = user && publicRoommateProfile(user);
    if (!mine?.setupComplete || !mine.active) {
      return res.json({ success: true, profiles: [], setupRequired: true });
    }

    const users = await User.find({
      _id: { $ne: req.user._id, $nin: mine.blockedUsers || [] },
      "roommatePreferences.setupComplete": true,
      "roommatePreferences.active": true,
      "roommatePreferences.blockedUsers": { $ne: req.user._id },
    })
      .select("name username avatar bio city area organization preferredCollege occupation gender course subject studyYear roommatePreferences")
      .lean();
    const userIds = users.map((candidate) => candidate._id);
    const [outgoing, incoming] = await Promise.all([
      RoommateRequest.find({ from: req.user._id, to: { $in: userIds } }).select("to status").lean(),
      RoommateRequest.find({ to: req.user._id, from: { $in: userIds } }).select("from status").lean(),
    ]);
    const outgoingMap = new Map(outgoing.map((request) => [String(request.to), request.status]));
    const incomingMap = new Map(incoming.map((request) => [String(request.from), request.status]));

    const discovered = users
      .map((candidate) => ({
        user: candidate,
        ...publicRoommateProfile(candidate),
      }))
      .filter((profile) => compatibleSeeking(mine.seeking, profile.seeking))
      .filter((profile) => {
        if (mineProfile.city && profile.city && mineProfile.city.toLowerCase() !== profile.city.toLowerCase()) return false;
        if (
          mine.budgetMax > 0 &&
          profile.budgetMax > 0 &&
          (mine.budgetMin > profile.budgetMax || profile.budgetMin > mine.budgetMax)
        ) return false;
        return true;
      })
      .map((profile) => ({
        id: String(profile.user._id),
        name: profile.user.name,
        username: profile.user.username,
        avatar: profile.user.avatar,
        seeking: profile.seeking,
        gender: profile.user.gender,
        occupation: profile.user.occupation,
        organization: profile.user.occupation === "student"
          ? profile.user.organization || profile.user.preferredCollege || ""
          : "",
        course: profile.user.occupation === "student" ? profile.user.course : "",
        subject: profile.user.occupation === "student" ? profile.user.subject : "",
        studyYear: profile.user.occupation === "student" ? profile.user.studyYear : "",
        bio: profile.bio,
        city: profile.city,
        area: profile.area,
        compatibility: scoreMatch(mineProfile, profile),
        budgetMin: profile.budgetMin || 0,
        budgetMax: profile.budgetMax || 0,
        sharingType: profile.sharingType || "",
        moveInDate: profile.moveInDate || null,
        outgoingStatus: outgoingMap.get(String(profile.user._id)) || null,
        incomingStatus: incomingMap.get(String(profile.user._id)) || null,
      }))
      .sort((a, b) => b.compatibility - a.compatibility);

    res.json({ success: true, profiles: discovered });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const sendRequest = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const targetId = req.params.userId;
    if (!mongoose.isValidObjectId(targetId) || String(targetId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Invalid roommate profile" });
    }
    const [mineUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetId),
    ]);
    const mine = mineUser?.roommatePreferences;
    const target = targetUser?.roommatePreferences;
    if (!mine?.setupComplete || !mine.active || !target?.setupComplete || !target.active) {
      return res.status(404).json({ success: false, message: "Active roommate profile not found" });
    }
    if (
      mine.blockedUsers.some((id) => String(id) === String(targetId)) ||
      target.blockedUsers.some((id) => String(id) === String(req.user._id))
    ) {
      return res.status(404).json({ success: false, message: "Active roommate profile not found" });
    }
    if (!compatibleSeeking(mine.seeking, target.seeking)) {
      return res.status(400).json({ success: false, message: "Your roommate preferences do not match" });
    }

    const reverse = await RoommateRequest.findOne({ from: targetId, to: req.user._id });
    if (reverse?.status === "pending") {
      reverse.status = "accepted";
      await reverse.save();
      try {
        await Promise.all([
          notifyUser(req.user._id, {
            type: "roommate_accepted",
            title: "Roommate interest accepted",
            body: "Your roommate interest was accepted.",
            link: "/roommates/messages",
          }),
          notifyUser(targetId, {
            type: "roommate_accepted",
            title: "It's a roommate match",
            body: "Your roommate connection is now accepted.",
            link: "/roommates/messages",
          }),
        ]);
        await markRoommateNotificationsRead(req.user._id, {
          type: "roommate_request",
          senderId: targetId,
        });
      } catch (error) {
        console.error("ROOMMATE ACCEPTANCE NOTIFICATION ERROR:", error);
      }
      return res.json({ success: true, status: "accepted", message: "It's a match! You can now chat privately on RoomSlider." });
    }
    if (reverse?.status === "accepted") {
      return res.status(409).json({ success: false, message: "You are already connected with this person" });
    }

    const existing = await RoommateRequest.findOne({ from: req.user._id, to: targetId });
    if (existing?.status === "pending" || existing?.status === "accepted") {
      return res.status(409).json({ success: false, message: "You have already connected with this person" });
    }
    const request = existing || new RoommateRequest({ from: req.user._id, to: targetId });
    request.status = "pending";
    await request.save();
    try {
      await notifyUser(targetId, {
        type: "roommate_request",
        title: "New roommate interest",
        body: "Someone is interested in connecting as roommates.",
        link: "/roommates/requests",
        data: { senderId: String(req.user._id), requestId: String(request._id) },
      });
    } catch (error) {
      console.error("ROOMMATE REQUEST NOTIFICATION ERROR:", error);
    }
    res.status(201).json({ success: true, status: request.status });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already sent a request" });
    }
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getRequests = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const type = req.query.type;
    if (type && !["received", "sent"].includes(type)) {
      return res.status(400).json({ success: false, message: "Request type must be received or sent" });
    }
    const currentUser = await User.findById(req.user._id).select("roommatePreferences.blockedUsers").lean();
    const blockedIds = (currentUser?.roommatePreferences?.blockedUsers || []).map(String);
    const requestFilter = type === "received"
      ? { to: req.user._id }
      : type === "sent"
        ? { from: req.user._id }
        : { $or: [{ from: req.user._id }, { to: req.user._id }] };
    const requests = await RoommateRequest.find({
      ...requestFilter,
    })
      .sort({ updatedAt: -1 })
      .populate("from", "name username avatar roommatePreferences.blockedUsers")
      .populate("to", "name username avatar roommatePreferences.blockedUsers")
      .lean();
    const visible = requests.filter((request) => {
      const person = String(request.from?._id) === String(req.user._id) ? request.to : request.from;
      return person &&
        !blockedIds.includes(String(person._id)) &&
        !(person.roommatePreferences?.blockedUsers || []).some((id) => String(id) === String(req.user._id));
    });
    res.json({
      success: true,
      requests: visible.map((request) => ({
        id: String(request._id),
        status: request.status,
        direction: String(request.from?._id) === String(req.user._id) ? "outgoing" : "incoming",
        person: (() => {
          const person = String(request.from?._id) === String(req.user._id) ? request.to : request.from;
          return { _id: String(person._id), name: person.name, username: person.username, avatar: person.avatar };
        })(),
        updatedAt: request.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const respondToRequest = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    if (!["accepted", "declined"].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Choose accept or decline" });
    }
    const request = await RoommateRequest.findOne({
      _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null,
      to: req.user._id,
      status: "pending",
    });
    if (!request) {
      return res.status(404).json({ success: false, message: "Pending request not found" });
    }
    request.status = req.body.status;
    await request.save();
    try {
      await markRoommateNotificationsRead(req.user._id, {
        type: "roommate_request",
        senderId: request.from,
        requestId: request._id,
      });
    } catch (error) {
      console.error("ROOMMATE REQUEST NOTIFICATION READ ERROR:", error);
    }
    if (request.status === "accepted") {
      try {
        await notifyUser(request.from, {
          type: "roommate_accepted",
          title: "Roommate interest accepted",
          body: "Your roommate interest was accepted.",
          link: "/roommates/messages",
        });
      } catch (error) {
        console.error("ROOMMATE ACCEPTANCE NOTIFICATION ERROR:", error);
      }
    }
    if (req.body.status === "accepted") {
      await RoommateRequest.deleteOne({
        from: req.user._id,
        to: request.from,
        status: "pending",
      });
    }
    res.json({ success: true, status: request.status });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getConnections = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const currentUser = await User.findById(req.user._id).select("roommatePreferences.blockedUsers").lean();
    const blockedIds = currentUser?.roommatePreferences?.blockedUsers || [];
    const requests = await RoommateRequest.find({
      status: "accepted",
      from: { $nin: blockedIds },
      to: { $nin: blockedIds },
      $or: [{ from: req.user._id }, { to: req.user._id }],
    }).lean();
    const otherIds = requests.map((request) =>
      String(request.from) === String(req.user._id) ? request.to : request.from
    );
    const users = await User.find({
      _id: { $in: otherIds, $nin: blockedIds },
      role: "user",
      "roommatePreferences.blockedUsers": { $ne: req.user._id },
    })
      .select("name username avatar")
      .lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));
    res.json({
      success: true,
      connections: otherIds
        .map((id) => userMap.get(String(id)))
        .filter(Boolean)
        .map((user) => ({
          id: String(user._id),
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getConversations = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const currentUser = await User.findById(req.user._id).select("roommatePreferences.blockedUsers").lean();
    const blockedIds = currentUser?.roommatePreferences?.blockedUsers || [];
    const accepted = await RoommateRequest.find({
      status: "accepted",
      from: { $nin: blockedIds },
      to: { $nin: blockedIds },
      $or: [{ from: req.user._id }, { to: req.user._id }],
    }).select("from to").lean();
    const otherIds = [...new Set(accepted.map((request) =>
      String(request.from) === String(req.user._id) ? String(request.to) : String(request.from)
    ))];
    const users = await User.find({
      _id: { $in: otherIds, $nin: blockedIds },
      role: "user",
      "roommatePreferences.blockedUsers": { $ne: req.user._id },
    }).select("name username avatar").lean();
    const conversations = await Promise.all(users.map(async (person) => {
      const filter = {
        $or: [
          { from: req.user._id, to: person._id },
          { from: person._id, to: req.user._id },
        ],
      };
      const [last, unreadCount] = await Promise.all([
        RoommateMessage.findOne(filter).sort({ createdAt: -1 }).select("body createdAt").lean(),
        RoommateMessage.countDocuments({
          from: person._id,
          to: req.user._id,
          readAt: null,
          isRead: { $ne: true },
        }),
      ]);
      return {
        id: String(person._id),
        name: person.name,
        username: person.username,
        avatar: person.avatar,
        lastMessage: last?.body || "",
        lastMessageAt: last?.createdAt || null,
        unreadCount,
      };
    }));
    conversations.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const markConversationRead = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const otherUserId = req.params.id;
    if (!mongoose.isValidObjectId(otherUserId) || String(otherUserId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Invalid roommate connection" });
    }
    if (!(await getAcceptedConnection(req.user._id, otherUserId))) {
      return res.status(403).json({ success: false, message: "This roommate connection is not available" });
    }
    const readAt = new Date();
    const result = await RoommateMessage.updateMany(
      { from: otherUserId, to: req.user._id, readAt: null, isRead: { $ne: true } },
      { $set: { readAt, isRead: true } }
    );
    try {
      await markRoommateNotificationsRead(req.user._id, { type: "roommate_message", senderId: otherUserId });
    } catch (error) {
      console.error("ROOMMATE MESSAGE NOTIFICATION READ ERROR:", error);
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getRoommateBadges = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const currentUser = await User.findById(req.user._id).select("roommatePreferences.blockedUsers").lean();
    const blockedIds = currentUser?.roommatePreferences?.blockedUsers || [];
    const pending = await RoommateRequest.find({
      to: req.user._id,
      from: { $nin: blockedIds },
      status: "pending",
    }).populate("from", "roommatePreferences.blockedUsers").lean();
    const pendingRequests = pending.filter((request) =>
      !(request.from?.roommatePreferences?.blockedUsers || []).some((id) => String(id) === String(req.user._id))
    ).length;
    const unreadMessages = (await getConversationsForUser(req.user._id))
      .reduce((count, conversation) => count + conversation.unreadCount, 0);
    res.json({
      pendingRequests,
      unreadMessages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getConversationsForUser = async (userId) => {
  const currentUser = await User.findById(userId).select("roommatePreferences.blockedUsers").lean();
  const blockedIds = currentUser?.roommatePreferences?.blockedUsers || [];
  const accepted = await RoommateRequest.find({
    status: "accepted",
    from: { $nin: blockedIds },
    to: { $nin: blockedIds },
    $or: [{ from: userId }, { to: userId }],
  }).select("from to").lean();
  const otherIds = [...new Set(accepted.map((request) =>
    String(request.from) === String(userId) ? String(request.to) : String(request.from)
  ))];
  const users = await User.find({
    _id: { $in: otherIds, $nin: blockedIds },
    role: "user",
    "roommatePreferences.blockedUsers": { $ne: userId },
  }).select("_id").lean();
  const counts = await Promise.all(users.map((person) => RoommateMessage.countDocuments({
    from: person._id,
    to: userId,
    readAt: null,
    isRead: { $ne: true },
  })));
  return counts.map((unreadCount) => ({ unreadCount }));
};

const cancelRequest = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const request = await RoommateRequest.findOne({
      _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null,
      from: req.user._id,
      status: "pending",
    });
    if (!request) return res.status(404).json({ success: false, message: "Pending sent request not found" });
    await request.deleteOne();
    try {
      await markRoommateNotificationsRead(request.to, {
        type: "roommate_request",
        senderId: req.user._id,
        requestId: request._id,
      });
    } catch (error) {
      console.error("ROOMMATE REQUEST NOTIFICATION READ ERROR:", error);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const blockUser = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const targetId = req.params.userId;
    if (!mongoose.isValidObjectId(targetId) || String(targetId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Invalid user" });
    }
    const user = await User.findById(req.user._id);
    if (!user.roommatePreferences) {
      user.roommatePreferences = { active: false, blockedUsers: [targetId] };
    } else {
      user.roommatePreferences.blockedUsers.addToSet(targetId);
    }
    await user.save();
    await RoommateRequest.deleteMany({
      $or: [
        { from: req.user._id, to: targetId },
        { from: targetId, to: req.user._id },
      ],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const reportUser = async (req, res) => {
  try {
    if (!isRegularUser(req, res)) return;
    const targetId = req.params.userId;
    const reason = cleanText(req.body.reason, 500);
    if (!mongoose.isValidObjectId(targetId) || String(targetId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Invalid user" });
    }
    const targetExists = await User.exists({ _id: targetId, roommatePreferences: { $exists: true } });
    if (!targetExists) {
      return res.status(404).json({ success: false, message: "Roommate profile not found" });
    }
    await RoommateReport.findOneAndUpdate(
      { reporter: req.user._id, reported: targetId },
      { $set: { reason } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, message: "Report submitted" });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

module.exports = {
  getMyProfile,
  getPublicProfile,
  updateMyProfile,
  getDiscover,
  sendRequest,
  getRequests,
  respondToRequest,
  getConnections,
  getConversations,
  markConversationRead,
  getRoommateBadges,
  getChatMessages,
  sendChatMessage,
  cancelRequest,
  blockUser,
  reportUser,
};
