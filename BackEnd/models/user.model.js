import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    playerName: { type: String, required: true, unique: true },
    score: { type: Number, required: true, },
});

export default mongoose.model("users", userSchema);