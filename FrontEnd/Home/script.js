// ดึงข้อมูลการตั้งค่ามาจากหน้าตั้งค่าโดยตรงผ่าน localStorage
const STORAGE_KEY = 'mathrunner_settings';
const savedData = localStorage.getItem(STORAGE_KEY);
const currentSettings = savedData ? JSON.parse(savedData) : { character: 1 }; // ตัวสำรองเผื่อยังไม่เคยเซฟค่า

const boy = document.getElementById('boyRun');
const girl = document.getElementById('girlRun');

let positionBoy = -350;
let positionGirl = -350;
const screenWidth = window.innerWidth;

// ฟังก์ชันคุมการเปิด/ปิด รูปภาพตามตัวละครที่เลือก
const currentCharacter = () => {
    if (currentSettings.character === 1) {       // 1 = หญิง
        boy.style.display = 'none';
        girl.style.display = 'block';
    } else if (currentSettings.character === 2) { // 2 = ชาย
        girl.style.display = 'none';
        boy.style.display = 'block';
    }
}

// ฟังก์ชันทำแอนิเมชันตัวละครวิ่ง
const animate = () => {
    // ให้ขยับเฉพาะตัวละครที่กำลังแสดงผลอยู่
    if (currentSettings.character === 2) { // ผู้ชายวิ่ง
        boy.style.left = positionBoy + "px";
        positionBoy += 2;
        if (positionBoy > screenWidth) {
            positionBoy = -boy.offsetWidth;  
        }
    } else { // ผู้หญิงวิ่ง
        girl.style.left = positionGirl + "px";
        positionGirl += 2;
        if (positionGirl > screenWidth) {
            positionGirl = -girl.offsetWidth;
        }
    }
    
    requestAnimationFrame(animate);
}

// สั่งเปิดตัวละครที่ถูกต้องและเปิดระบบวิ่งทันที
currentCharacter();
animate();