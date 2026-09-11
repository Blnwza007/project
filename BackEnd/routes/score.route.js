import express from "express";
import Score from "../models/score.model.js";

const router = express.Router();

// POST /scores  — บันทึกคะแนนใหม่ (แต่ละรอบที่เล่น)
router.post("/", async (req, res) => {
    try {
        const { playerName, score, level, deviceId } = req.body;

        if (!playerName || score === undefined) {
            return res.status(400).json({
                msg: "playerName and score are required"
            });
        }

        const newScore = new Score({
            playerName: playerName.trim(),
            score: Number(score),
            level: Number(level) || 1,
            deviceId: deviceId || null,
        });

        await newScore.save();
        console.log(`บันทึกคะแนน: ${playerName} → ${score} pts (Level ${level})`);

        return res.status(201).json({
            msg: "Score saved",
            data: { playerName, score, level, deviceId }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Internal server error", error: error.message });
    }
});

// GET /scores  — ดึง leaderboard top 20 (best score per player)
router.get("/", async (req, res) => {
    try {
        // เรียงตามคะแนนสูงสุดก่อน แล้วค่อย group เพื่อให้ $first
        // ดึงค่าจากแถวที่คะแนนสูงสุดของผู้เล่นคนนั้นจริงๆ (รวมถึง deviceId เจ้าของ)
        const leaderboard = await Score.aggregate([
            { $sort: { score: -1, date: -1 } },
            {
                $group: {
                    _id: "$playerName",
                    score:    { $first: "$score" },
                    level:    { $first: "$level" },
                    date:     { $first: "$date" },
                    deviceId: { $first: "$deviceId" }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 20 },
            {
                $project: {
                    _id: 0,
                    playerName: "$_id",
                    score: 1,
                    level: 1,
                    date: 1,
                    deviceId: 1
                }
            }
        ]);

        return res.json({ data: leaderboard });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Internal server error", error: error.message });
    }
});

export default router;

