const mongoose = require('mongoose');
let uuidv1 = require('uuidv1');
const {ObjectId} = mongoose.Schema;
const crypto = require('crypto');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    photo: {
        data: Buffer,
        contenType: String
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    hashed_password: {
        type: String,
        required: true,
    },
    isDeaf: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    occupation: String,
    salt: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    following: [{type: ObjectId, ref: "User"}],
    followers: [{type: ObjectId, ref: "User"}],
    posts: [{type: ObjectId, ref: 'Post'}],
    schedule: [{type: ObjectId, ref: 'Post'}],
    requireAdmin: {
        type: Boolean,
        default: false
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    resetPasswordLink: {
        data: String,
        default: ""
    },
});

// virtual field
userSchema
    .virtual("password")
    .set(function (password) {
        // create temporary variable called _password
        this._password = password;
        // generate a timestamp
        this.salt = uuidv1();
        // encryptPassword()
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    });

// methods
userSchema.methods = {
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },

    encryptPassword: function (password) {
        if (!password) return "";
        try {
            return crypto
                .createHmac("sha1", this.salt)
                .update(password)
                .digest("hex");
        } catch (err) {
            return "";
        }
    }
};

// pre middleware
userSchema.pre("remove", function (next) {
    NewPost.remove({postedBy: this._id}).exec();
    next();
});

module.exports = mongoose.model("User", userSchema);