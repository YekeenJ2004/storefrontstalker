import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    userId: String,
    role: String,
    storefrontIds: [String],
});

const StorefrontSchema = new mongoose.Schema({
    storefrontId: String,
    domain: Number,
    name: String,
    asins: [String],
});

export const User = mongoose.model('User', UserSchema);
export const Storefront = mongoose.model('Storefront', StorefrontSchema);
