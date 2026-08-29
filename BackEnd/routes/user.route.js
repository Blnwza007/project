import express from "express";
import users from "../models/user.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {playerName, score} = req.body
        const userFind = await users.findOne( { playerName } );
        if (userFind) {
            return res.status(409).json( { 
                msgThai: "ชื่อมีคนใช้ไปแล้ว", 
                msgEng: "Username already taken" 
            } )
        } else {
            const user = new users( {
                playerName,
                score
            });
            await user.save()
            console.log(`สร้างบัญชี ${playerName} เสร็จแล้ว!!`);
            return res.status(201).json({
                msgThai: `สร้างบัญชี ${playerName} สำเร็จ!`,
                msgEng: "User created successfully",
                data: { playerName, score }
            })
        }
    } catch(error) {
        console.log(error)
        return res.status(500).json({
            msgThai: "เกิดข้อผิดพลาดในระบบ",
            msgEng: "Internal server error",
            error: error.message
        })
    }
})

export default router;