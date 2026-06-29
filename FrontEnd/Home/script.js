const STORAGE_KEY = 'mathrunner_settings';
const savedData = localStorage.getItem(STORAGE_KEY);
const currentSettings = savedData ? JSON.parse(savedData) : { character: 1 }; 

const boy = document.getElementById('boyRun');
const girl = document.getElementById('girlRun');

let positionBoy = -350;
let positionGirl = -350;
const screenWidth = window.innerWidth;

const currentCharacter = () => {
    if (currentSettings.character === 1) {       
        boy.style.display = 'none';
        girl.style.display = 'block';
    } else if (currentSettings.character === 2) { 
        girl.style.display = 'none';
        boy.style.display = 'block';
    }
}

const animate = () => {
    
    if (currentSettings.character === 2) { 
        boy.style.left = positionBoy + "px";
        positionBoy += 2;
        if (positionBoy > screenWidth) {
            positionBoy = -boy.offsetWidth;  
        }
    } else { 
        girl.style.left = positionGirl + "px";
        positionGirl += 2;
        if (positionGirl > screenWidth) {
            positionGirl = -girl.offsetWidth;
        }
    }
    
    requestAnimationFrame(animate);
}

currentCharacter();
animate();