const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        data: Buffer,
        contentType: String
    },
    search: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    likes: [{ type: ObjectId, ref: "User" }],
    posts: [{ type: ObjectId, ref: "Post" }],
});

module.exports = mongoose.model("Tag", tagSchema);