const _ = require('lodash');
const User = require('../models/user');
const formidable = require('formidable');
const fs = require('fs');

exports.userById = (req, res, next, id) => {
    User.findById(id)
        .populate('following', '_id name')
        .populate('followers', '_id name')
        .exec((err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    error: 'Usuário não encontrado'
                });
            }
            req.profile = user;
            next();
        });
};

exports.hasAuthorization = (req, res, next) => {
    let sameUser = req.profile && req.auth && req.profile._id === req.auth._id;
    let adminUser = req.profile && req.auth && req.auth.role === 'admin';

    const authorized = sameUser || adminUser;

    if (!authorized) {
        return res.status(403).json({
            error: 'Usuário não tem permissão para efetuar essa operação'
        });
    }
    next();
};

exports.allUsers = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.limit);
        const search = req.query.search !== 'undefined' ? req.query.search : '';
        const order = req.query.order !== 'undefined' ? {[req.query.order]: req.query.order === 'name' ? 1 : -1} : {created: -1};
        const totalItems = await User.find({isAdmin: true, name: {$regex: search, $options: 'i'}}).countDocuments();
        let users = await User.find({isAdmin: true, name: {$regex: search, $options: 'i'}})
            .skip((currentPage - 1) * perPage)
            .select("isDeaf isAdmin following followers name email deleted city state posts")
            .sort(order)
            .limit(perPage);
        return await res.json({totalItems, users});
    } catch (e) {
        return await res.status(400).json({
            message: e.message
        });
    }
};

exports.getSolicitations = async (req, res) => {
    try {
        const search = req.query.search;
        const users = await User.find({requireAdmin: true, name: {$regex: search, $options: 'i'}})
            .select("isDeaf requireAdmin name email city state")
        return await res.json({users});
    } catch (e) {
        return await res.status(400).json({
            message: e.message
        });
    }
};

exports.requireAdmin = async (req, res) => {
    try {
        let user = req.profile;
        user.requireAdmin = true;
        user.updated = Date.now();
        user = await user.save();
        user.hashed_password = undefined;
        user.salt = undefined;
        return res.json(user);
    } catch (e) {
        return await res.status(400).json({
            message: e.message
        });
    }
};

exports.acceptReq = async (req, res) => {
    try {
        let user = req.profile;
        user.requireAdmin = false;
        user.isAdmin = true;
        user.updated = Date.now();
        user = await user.save();
        user.hashed_password = undefined;
        user.salt = undefined;
        return res.json(user);
    } catch (e) {
        return await res.status(400).json({
            message: e.message
        });
    }
};

exports.getUser = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};

exports.updateUser = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'A foto não foi carregada'
            });
        }
        let user = req.profile;
        user = _.extend(user, fields);
        user.updated = Date.now();

        if (files.photo) {
            user.photo.data = fs.readFileSync(files.photo.path);
            user.photo.contentType = files.photo.type;
        }

        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            user.hashed_password = undefined;
            user.salt = undefined;
            res.json(user);
        });
    });
};

exports.userPhoto = (req, res, next) => {
    if (req.profile.photo.data) {
        res.set('Content-Type', req.profile.photo.contentType);
        return res.send(req.profile.photo.data);
    }
    next();
};

exports.addFollowing = (req, res, next) => {
    User.findByIdAndUpdate(req.body.userId,
        {$push: {following: req.body.followId}},
        (err, result) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            next();
        });
};

exports.addFollower = (req, res) => {
    User.findByIdAndUpdate(req.body.followId,
        {$push: {followers: req.body.userId}},
        {new: true})
        .populate('following', '_id name')
        .populate('followers', '_id name')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            result.hashed_password = undefined;
            result.salt = undefined;
            res.json(result);
        });
};

exports.removeFollowing = (req, res, next) => {
    User.findByIdAndUpdate(req.body.userId,
        {$pull: {following: req.body.unfollowId}},
        (err, result) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            next();
        });
};

exports.removeFollower = (req, res) => {
    User.findByIdAndUpdate(req.body.unfollowId,
        {$pull: {followers: req.body.userId}},
        {new: true})
        .populate('following', '_id name')
        .populate('followers', '_id name')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            result.hashed_password = undefined;
            result.salt = undefined;
            res.json(result);
        });
};

exports.addSchedule = (req, res) => {
    User.findByIdAndUpdate(req.body.userId,
        {$push: {schedule: req.body.postId}},
        {new: true})
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            result.hashed_password = undefined;
            result.salt = undefined;
            res.json(result);
        });
};

exports.removeSchedule = (req, res) => {
    User.findByIdAndUpdate(req.body.userId,
        {$pull: {schedule: req.body.postId}},
        {new: true})
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            result.hashed_password = undefined;
            result.salt = undefined;
            res.json(result);
        });
};