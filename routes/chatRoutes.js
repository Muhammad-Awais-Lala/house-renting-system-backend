const express = require('express');
const {
  createOrGetChat,
  getUserChats,
  getChatMessages,
  sendMessage
} = require('../controllers/chatController');
const auth = require('../middleware/auth'); 

const router = express.Router();

router.use(auth); // All chat routes are protected

router.route('/')
  .post(createOrGetChat)
  .get(getUserChats);

router.route('/:chatId/messages')
  .get(getChatMessages)
  .post(sendMessage);

module.exports = router;
