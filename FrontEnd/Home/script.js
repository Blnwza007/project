const boy = document.getElementById('boyRun');
let position = -350;
const screenWidth = window.screen.width;

const animate = () => {
    boy.style.left = position + "px";
    position += 2;
  
    if (position > screenWidth) {
        position = -boy.offsetWidth;  
    }
    requestAnimationFrame(animate);
}
animate()