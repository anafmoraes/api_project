const express = require('express');
const { signup, login, logout} = require('../controllers/auth');

const { signupValidator, signinValidator, passwordResetValidator } = require('../validator');
const { userById } = require('../controllers/user');

const router = express.Router();

router.post('/signup', signupValidator, signup);
router.post('/login', signinValidator, login);
router.get('/logout', logout);

//Qualquer rota que conter userId, vai executar o método userById
router.param('userId', userById);

// // password forgot and reset routes
// router.put('/reset-password', passwordResetValidator, resetPassword);
//
// // then use this route for social login
// router.post('/social-login', socialLogin);
//


module.exports = router;