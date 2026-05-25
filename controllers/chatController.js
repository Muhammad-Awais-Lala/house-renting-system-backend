const Chat = require('../models/Chat');
const Message = require('../models/Message');

// @desc    Create or get existing chat
// @route   POST /api/chats
// @access  Private
exports.createOrGetChat = async (req, res, next) => {
  try {
    const { propertyId, landlordId } = req.body;
    const tenantId = req.user.id; // from auth middleware

    if (!propertyId || !landlordId) {
      return res.status(400).json({ success: false, message: 'propertyId and landlordId are required' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      propertyId,
      tenantId,
      landlordId
    }).populate('propertyId', 'title images price location')
      .populate('landlordId', 'firstName lastName profileImage')
      .populate('tenantId', 'firstName lastName profileImage')
      .populate('lastMessage');

    if (chat) {
      return res.status(200).json({ success: true, chat });
    }

    // Create new chat
    chat = await Chat.create({
      propertyId,
      tenantId,
      landlordId,
      participants: [tenantId, landlordId]
    });

    chat = await Chat.findById(chat._id)
      .populate('propertyId', 'title images price location')
      .populate('landlordId', 'firstName lastName profileImage')
      .populate('tenantId', 'firstName lastName profileImage');

    res.status(201).json({ success: true, chat });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chats of logged-in user
// @route   GET /api/chats
// @access  Private
exports.getUserChats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ participants: userId })
      .populate('propertyId', 'title images price location')
      .populate('landlordId', 'firstName lastName profileImage')
      .populate('tenantId', 'firstName lastName profileImage')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, chats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages of a specific chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
exports.getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat' });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message (fallback/API way)
// @route   POST /api/chats/:chatId/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { message, receiverId } = req.body;
    const senderId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const newMessage = await Message.create({
      chatId,
      senderId,
      receiverId,
      message,
      messageType: 'text'
    });

    chat.lastMessage = newMessage._id;
    await chat.save();

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    next(error);
  }
};
