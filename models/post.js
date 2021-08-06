const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    photo: {
        data: Buffer,
        contenType: String
    },
    postedBy: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    accessibility: Number,
    address: String,
    video: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    likes: [{ type: ObjectId, ref: 'User' }],
    tag: { type: ObjectId, ref: 'Tag' },
    date: {
        type: Date,
    },
    comments: [
        {
            text: String,
            created: { type: Date, default: Date.now },
            postedBy: { type: ObjectId, ref: 'User' }
        }
    ],
    rating: [
        {
            rate: Number,
            postedBy: { type: ObjectId, ref: 'User' }
        }
    ],
    city: {
        type: String
    },
    state: {
        type: String
    },
});

module.exports = mongoose.model('Post', postSchema);