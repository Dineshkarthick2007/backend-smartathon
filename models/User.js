const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        profilePicture: {
            type: String,
            default: '',
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false, // We manage timestamps manually
        collection: 'users', // Explicitly map to 'users' collection
    }
);

// Virtual field to clean up JSON response
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.googleId; // Don't expose googleId in responses
        return ret;
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
