const express = require('express');
const {allTags, createTag, photo, tagById, getTagById, like, unlike} = require('../controllers/tag');
const {requireLogin} = require('../controllers/auth');

const router = express.Router();

router.get('/tags', requireLogin, allTags);
router.post('/tags', requireLogin, createTag);
router.get('/tag/photo/:tagId', photo);
router.get('/tag/:tagId', getTagById);

// like unlike
router.put('/tag/like', requireLogin, like);
router.put('/tag/unlike', requireLogin, unlike);

router.param('tagId', tagById);

module.exports = router;
