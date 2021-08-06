const User = require('../models/user');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const dotenv = require("dotenv");
const _ = require("lodash");
const {sendEmail} = require("../helpers");
dotenv.config();

exports.signup = async (req, res) => {
    try {
        const userExists = await User.findOne({email: req.body.email});
        if (userExists)
            throw res.status(403).json({
                message: 'Email já está sendo usado'
            });
        const user = await new User(req.body);
        await user.save();
        return res.status(200).json({user});
    } catch (e) {
        return await res.status(400).json({
            message: e.message
        });
    }

};

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (!user || !user.authenticate(password)) {
            throw res.status(401).json({
                error: "Email ou senha incorretos"
            })
        }
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
        res.cookie("t", token, {expire: new Date() + 9999});
        return await res.json({token, user});
    } catch (e) {
        return await res.status(400).json({
            message: e.message
        });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie("t");
    return res.json({message: "Logout feito com sucesso"});
};

exports.requireLogin = expressJwt({
    secret: process.env.JWT_SECRET,
    userProperty: "auth"
});

exports.forgotPassword = (req, res) => {
    if (!req.body)
        return res.status(400).json({message: "Sem requisição"});
    if (!req.body.email)
        return res.status(400).json({message: "Entre com um email"});
    const {email} = req.body;
    User.findOne({email}, (err, user) => {
        if (err || !user)
            return res.status("401").json({
                error: "Usuário com esse email não existe"
            });

        const token = jwt.sign(
            {_id: user._id, iss: "NODEAPI"},
            process.env.JWT_SECRET
        );

        const emailData = {
            from: "noreply@node-react.com",
            to: email,
            subject: "Instruções de recuperação de senha",
            text: `Use o link para recuperar sua senha: ${
                process.env.CLIENT_URL
            }/reset-password/${token}`,
            html: `<p>Use o link para recuperar sua senha:</p> <p>${
                process.env.CLIENT_URL
            }/reset-password/${token}</p>`
        };

        return user.updateOne({resetPasswordLink: token}, (err, success) => {
            if (err) {
                return res.json({message: err});
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `O email foi enviado para ${email}. Siga as instruções para recuperar sua senha.`
                });
            }
        });
    });
};

exports.resetPassword = (req, res) => {
    const {resetPasswordLink, newPassword} = req.body;
    User.findOne({resetPasswordLink}, (err, user) => {
        if (err || !user)
            return res.status("401").json({
                error: "Link inválido!"
            });

        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ""
        };

        user = _.extend(user, updatedFields);
        user.updated = Date.now();

        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: `Faça login com a nova senha!`
            });
        });
    });
};