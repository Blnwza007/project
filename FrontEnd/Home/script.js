const boy = document.getElementById('boyRun');
let position = -350;

const animate = () => {
    boy.style.left = position + "px";
    position += 2;
  
    if (position > window.innerWidth) {
        position = -boy.offsetWidth;  
    }
    requestAnimationFrame(animate);
}
animate()