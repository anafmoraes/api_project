const Tag = require('../models/tag');
const Post = require('../models/Post');
const formidable = require('formidable');
const fs = require('fs');
const _ = require('lodash');

exports.postById = (req, res, next, id) => {
    Post.findById(id)
        .populate('postedBy', '_id name')
        .populate("comments", "text created")
        .populate("rating", "rate")
        .populate("tag", "name")
        .populate('comments.postedBy', '_id name photo')
        .exec((err, post) => {
            if (err || !post) {
                return res.status(400).json({
                    error: err
                });
            }
            req.post = post;
            next();
        });
};

exports.getSchedule = (req, res) => {
    let oldPosts, newPosts;
    Post.find({_id: {$in: req.profile.schedule}, date: {$gte: Date.now()}})
        .populate('postedBy', '_id name')
        .populate('likes')
        .populate('comments')
        .sort({date: 1})
        .exec((err, posts) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            newPosts = posts;
            Post.find({_id: {$in: req.profile.schedule}, date: {$lt: Date.now()}})
                .populate('postedBy', '_id name')
                .populate('likes')
                .populate('comments')
                .sort({date: -1})
                .exec((err, posts) => {
                    if (err) {
                        return res.status(400).json({
                            error: err
                        });
                    }
                    oldPosts = posts;
                    res.json({newPosts, oldPosts});
                });
        });
};

exports.getPosts = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.limit);
        const search = req.query.search !== 'undefined' ? req.query.search : '';
        const city = req.query.city;
        const state = req.query.state;
        let query = {
            deleted: false,
            title: {$regex: search, $options: 'i'},
            date: {$gte: Date.now()}
        };
        if (city)
            query.city = city;
        if (state)
            query.state = state;
        if (req.query.filter === 'online')
            query.isOnline = true;
        else if (req.query.filter === 'presencial')
            query.isOnline = {$in: [false, null, undefined]};

        let totalItems = await Post.find(query).countDocuments();
        let posts = await Post.find(query)
            .sort({date: 'asc'})
            .populate("postedBy", "_id name")
            .populate("tag", "name")
            .populate("comments", "text created")
            .populate("comments.postedBy", "_id name")
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        return await res.json({totalItems, posts});
    } catch (e) {
        return await res.status(400).json({
            message: e.message
        });
    }
};

exports.createPost = async (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'A foto não foi carregada'
            });
        }
        let post = new Post(fields);
        req.profile.hashed_password = undefined;
        req.profile.salt = undefined;
        post.postedBy = req.profile;
        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.path);
            post.photo.contentType = files.photo.type;
        }
        post.save(async (err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            try {
                await req.profile.update({$push: {posts: post}}).exec();
                Tag.findByIdAndUpdate(fields.tag, {$push: {posts: post}}).exec()
                return await res.json(result);
            } catch (e) {
                return res.status(400).json({
                    error: err
                });
            }
        });
    });
};

exports.getPostsByUser = async (u) => {
    return await Post.find({postedBy: u._id, deleted: false})
};

exports.postsByUser = async (req, res) => {
    try {
        const posts = await Post.find({postedBy: req.profile._id, deleted: false})
            .populate('postedBy', '_id name')
            .populate("comments", "text created")
            .populate("comments.postedBy", "_id name")
            .sort('_created');
        return await res.json(posts);
    } catch (e) {
        return res.status(400).json({
            error: e.message
        });
    }
};

exports.updatePost = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }
        let post = req.post;
        post = _.extend(post, fields);
        post.updated = Date.now();

        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.path);
            post.photo.contentType = files.photo.type;
        }

        post.save((err) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(post);
        });
    });
};

exports.deletePost = (req, res) => {
    let post = req.post;
    post.remove((err) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json({
            message: 'Post deleted successfully'
        });
    });
};

exports.photo = (req, res) => {
    res.set('Content-Type', req.post.photo.contentType);
    return res.send(req.post.photo.data);
};

exports.singlePost = (req, res) => {
    return res.json(req.post);
};

exports.like = (req, res) => {
    Post.findByIdAndUpdate(req.body.postId,
        {$push: {likes: req.body.userId}},
        {new: true})
        .populate('postedBy', '_id name')
        .exec(
            (err, result) => {
                if (err) {
                    return res.status(400).json({
                        error: err
                    });
                } else {
                    res.json(result);
                }
            }
        );
};

exports.unlike = (req, res) => {
    Post.findByIdAndUpdate(req.body.postId,
        {$pull: {likes: req.body.userId}},
        {new: true})
        .populate('postedBy', '_id name')
        .exec(
            (err, result) => {
                if (err) {
                    return res.status(400).json({
                        error: err
                    });
                } else {
                    res.json(result);
                }
            }
        );
};

exports.rating = (req, res) => {
    const rating = {
        rate: req.body.rate,
        postedBy: req.body.userId
    };
    let post = req.post;
    post.updated = Date.now();
    post.rating = post.rating.filter(r => {
        return r.postedBy != req.body.userId;
    });
    post.rating.push(rating);
    post.save((err) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json(post);
    });
}

exports.comment = (req, res) => {
    let comment = req.body.comment;
    comment.postedBy = req.body.userId;

    Post.findByIdAndUpdate(req.body.postId, {$push: {comments: comment}}, {new: true})
        .populate('comments.postedBy', '_id name')
        .populate('postedBy', '_id name')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            } else {
                res.json(result);
            }
        });
};

exports.uncomment = (req, res) => {
    let comment = req.body.comment;
    Post.findByIdAndUpdate(req.body.postId,
        {$pull: {comments: comment}},
        {new: true})
        .populate('comments.postedBy', '_id name')
        .populate('postedBy', '_id name')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            } else {
                console.log(result);
                return res.json(result);
            }
        });
};
