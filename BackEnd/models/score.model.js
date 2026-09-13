import mongoose from "mongoose";

const key = deviceId ? { deviceId } : { playerName: savedPlayerName }

await Score.findOneAndUpdate(
    key,
    {
        $max: { score: Number(score) },        // อัปเดตเฉพาะถ้าสูงกว่า
        $set: {
            playerName: savedPlayerName,
            level: Number(level) || 1,
            deviceId: deviceId || null,
            date: new Date()
        }
    },
    { upsert: true, new: true }
)

export default mongoose.model("scores", scoreSchema);