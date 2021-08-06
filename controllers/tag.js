const formidable = require('formidable');
const Tag = require('../models/tag');

exports.tagById = (req, res, next, id) => {
    Tag.findById(id)
        .populate('posts')
        .exec((err, tag) => {
            if (err || !tag) {
                return res.status(400).json({
                    error: err
                });
            }
            req.tag = tag;
            next();
        });
};

exports.allTags = async (req, res) => {
    try {
        const search = req.query.search || '';
        let tags = await Tag.find({search: {$regex: search, $options: 'i'}})
            .select('name _id likes posts')
            .sort({name: 1});
        return await res.json(tags);
    } catch (e) {
        return await res.status(400).json({
            message: e.message
        });
    }
};

exports.photo = (req, res) => {
    res.set('Content-Type', req.tag.icon.contentType);
    return res.send(req.tag.icon.data);
};

exports.getTagById = (req, res) => {
    return res.json(req.tag);
};

exports.createTag = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'A foto não foi carregada'
            });
        }
        let tag = new Tag(fields);
        if (files.icon) {
            tag.icon.data = fs.readFileSync(files.icon.path);
            tag.icon.contentType = files.icon.type;
        }
        tag.save(async (err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            return await res.json(result);
        });
    });
};

exports.like = (req, res) => {
    Tag.findByIdAndUpdate(req.body.tagId,
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
    Tag.findByIdAndUpdate(req.body.tagId,
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
