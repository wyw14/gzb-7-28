const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/storage');

const router = express.Router();

function enrichWork(work, users, likes, comments, currentUserId) {
  const user = users.find(u => u.id === work.userId) || null;
  const isLiked = currentUserId ? likes.some(l => l.workId === work.id && l.userId === currentUserId) : false;
  return {
    ...work,
    user,
    isLiked,
    likesCount: likes.filter(l => l.workId === work.id).length,
    commentsCount: comments.filter(c => c.workId === work.id).length
  };
}

router.get('/', (req, res) => {
  const works = readJSON('works.json', []);
  const users = readJSON('users.json', []);
  const likes = readJSON('workLikes.json', []);
  const comments = readJSON('workComments.json', []);
  const { userId, instrument, keyword, currentUserId } = req.query;
  
  let result = [...works];
  
  if (userId) {
    result = result.filter(w => w.userId === userId);
  }
  if (instrument) {
    result = result.filter(w => w.instrument === instrument);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    result = result.filter(w => 
      w.piece.toLowerCase().includes(kw) || 
      w.content.toLowerCase().includes(kw) ||
      w.instrument.toLowerCase().includes(kw)
    );
  }
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const enriched = result.map(w => enrichWork(w, users, likes, comments, currentUserId));
  
  res.json(enriched);
});

router.get('/:id', (req, res) => {
  const works = readJSON('works.json', []);
  const users = readJSON('users.json', []);
  const likes = readJSON('workLikes.json', []);
  const comments = readJSON('workComments.json', []);
  const { currentUserId } = req.query;
  
  const work = works.find(w => w.id === req.params.id);
  
  if (!work) {
    return res.status(404).json({ error: '作品不存在' });
  }
  
  const enriched = enrichWork(work, users, likes, comments, currentUserId);
  
  res.json(enriched);
});

router.post('/', (req, res) => {
  const works = readJSON('works.json', []);
  
  const { userId, instrument, piece, content, mediaUrl, mediaType } = req.body;
  
  if (!userId || !instrument || !piece || !content) {
    return res.status(400).json({ error: '请填写必要信息' });
  }
  
  const newWork = {
    id: 'w' + uuidv4().slice(0, 8),
    userId,
    instrument,
    piece,
    content,
    mediaUrl: mediaUrl || '',
    mediaType: mediaType || 'image',
    createdAt: new Date().toISOString()
  };
  
  works.unshift(newWork);
  writeJSON('works.json', works);
  
  res.json({ success: true, work: newWork });
});

router.delete('/:id', (req, res) => {
  const works = readJSON('works.json', []);
  const likes = readJSON('workLikes.json', []);
  const comments = readJSON('workComments.json', []);
  
  const idx = works.findIndex(w => w.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '作品不存在' });
  }
  
  works.splice(idx, 1);
  
  const remainingLikes = likes.filter(l => l.workId !== req.params.id);
  const remainingComments = comments.filter(c => c.workId !== req.params.id);
  
  writeJSON('works.json', works);
  writeJSON('workLikes.json', remainingLikes);
  writeJSON('workComments.json', remainingComments);
  
  res.json({ success: true });
});

router.post('/:id/like', (req, res) => {
  const likes = readJSON('workLikes.json', []);
  const works = readJSON('works.json', []);
  const { userId } = req.body;
  
  const work = works.find(w => w.id === req.params.id);
  if (!work) {
    return res.status(404).json({ error: '作品不存在' });
  }
  
  const existingLike = likes.find(l => l.workId === req.params.id && l.userId === userId);
  
  if (existingLike) {
    return res.status(400).json({ error: '已经点赞过了' });
  }
  
  const newLike = {
    id: 'l' + uuidv4().slice(0, 8),
    workId: req.params.id,
    userId,
    createdAt: new Date().toISOString()
  };
  
  likes.push(newLike);
  writeJSON('workLikes.json', likes);
  
  res.json({ success: true, like: newLike });
});

router.delete('/:id/like', (req, res) => {
  const likes = readJSON('workLikes.json', []);
  const { userId } = req.query;
  
  const idx = likes.findIndex(l => l.workId === req.params.id && l.userId === userId);
  
  if (idx === -1) {
    return res.status(404).json({ error: '未找到点赞记录' });
  }
  
  likes.splice(idx, 1);
  writeJSON('workLikes.json', likes);
  
  res.json({ success: true });
});

router.get('/:id/comments', (req, res) => {
  const comments = readJSON('workComments.json', []);
  const users = readJSON('users.json', []);
  
  const workComments = comments
    .filter(c => c.workId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(c => ({
      ...c,
      user: users.find(u => u.id === c.userId) || null
    }));
  
  res.json(workComments);
});

router.post('/:id/comments', (req, res) => {
  const comments = readJSON('workComments.json', []);
  const works = readJSON('works.json', []);
  const { userId, content } = req.body;
  
  const work = works.find(w => w.id === req.params.id);
  if (!work) {
    return res.status(404).json({ error: '作品不存在' });
  }
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }
  
  const newComment = {
    id: 'wc' + uuidv4().slice(0, 8),
    workId: req.params.id,
    userId,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  
  comments.push(newComment);
  writeJSON('workComments.json', comments);
  
  res.json({ success: true, comment: newComment });
});

router.delete('/:id/comments/:commentId', (req, res) => {
  const comments = readJSON('workComments.json', []);
  
  const idx = comments.findIndex(c => c.id === req.params.commentId && c.workId === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '评论不存在' });
  }
  
  comments.splice(idx, 1);
  writeJSON('workComments.json', comments);
  
  res.json({ success: true });
});

module.exports = router;
