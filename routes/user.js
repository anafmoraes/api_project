const express = require('express');
const {
    userById,
    allUsers,
    getUser,
    updateUser,
    userPhoto,
    addFollowing,
    addFollower,
    removeFollowing,
    removeFollower,
    addSchedule,
    removeSchedule,
    getSolicitations,
    requireAdmin,
    acceptReq
} = require('../controllers/user');
const {getSchedule} = require('../controllers/post');
const {
    requireLogin,
    forgotPassword,
    resetPassword
} = require('../controllers/auth');
const {passwordResetValidator} = require("../validator");

const router = express.Router();

router.put('/user/:userId/schedule', requireLogin, addSchedule);
router.put('/user/:userId/unschedule', requireLogin, removeSchedule);

router.put('/users/follow', requireLogin, addFollowing, addFollower);
router.put('/users/unfollow', requireLogin, removeFollowing, removeFollower);

router.get('/user/:userId/schedule', requireLogin, getSchedule);

router.get('/users/admin', requireLogin, getSolicitations);

router.get('/users', requireLogin, allUsers);
router.get('/user/:userId', requireLogin, getUser);
router.put('/user/:userId', requireLogin, updateUser);
router.put('/user/requireAdmin/:userId', requireLogin, requireAdmin);
router.put('/user/acceptReq/:userId', requireLogin, acceptReq);

//photo
router.get('/user/photo/:userId', userPhoto);

// password forgot and reset routes
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

//Qualquer rota que conter userId, vai executar o método userById e retornar um profile no req
router.param('userId', userById);

module.exports = router;
