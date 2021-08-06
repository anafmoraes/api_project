const express = require('express');
const {
    getPosts,
    createPost,
    postsByUser,
    postById,
    updatePost,
    singlePost,
    photo,
    like,
    unlike,
    comment,
    uncomment,
    rating
} = require('../controllers/post.js');
const {userById} = require('../controllers/user');
const {createPostValidator} = require('../validator');
const {requireLogin} = require('../controllers/auth');

const router = express.Router();

router.get('/posts', requireLogin, getPosts);
router.get('/post/by/:userId', requireLogin, postsByUser);

router.post('/post/new/:userId', requireLogin, createPost, createPostValidator);

router.put('/post/edit/:postId', requireLogin, updatePost);
router.get('/post/:postId', requireLogin, singlePost);

router.param('userId', userById);
router.param('postId', postById);

router.get('/post/photo/:postId', photo);

// like unlike
router.put('/post/like', requireLogin, like);
router.put('/post/unlike', requireLogin, unlike);

router.put('/post/comment', requireLogin, comment);
router.put('/post/uncomment', requireLogin, uncomment);

router.put('/post/:postId/rating', requireLogin, rating);

module.exports = router;
