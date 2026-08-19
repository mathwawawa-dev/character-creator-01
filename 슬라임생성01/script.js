const canvas = document.getElementById('slimeCanvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generateBtn');
const colorPicker = document.getElementById('slimeColor');

const GRID_SIZE = 16;
const PIXEL_SIZE = canvas.width / GRID_SIZE;

const bodyTemplates = [
    // Classic
    [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
        [0,0,0,0,0,2,1,4,1,1,2,0,0,0,0,0],
        [0,0,0,0,2,1,1,1,1,1,1,2,0,0,0,0],
        [0,0,0,2,1,1,1,1,1,1,1,1,2,0,0,0],
        [0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0],
        [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
        [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
        [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
        [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
        [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    // Wide
    [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0],
        [0,0,0,0,2,2,1,4,1,1,2,2,0,0,0,0],
        [0,0,0,2,1,1,1,1,1,1,1,1,2,0,0,0],
        [0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0],
        [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
        [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
        [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
        [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
        [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    // Tall
    [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
        [0,0,0,0,0,2,1,4,1,1,2,0,0,0,0,0],
        [0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],
        [0,0,0,0,2,1,1,1,1,1,1,2,0,0,0,0],
        [0,0,0,0,2,1,1,1,1,1,1,2,0,0,0,0],
        [0,0,0,2,1,1,1,1,1,1,1,1,2,0,0,0],
        [0,0,0,2,1,1,1,1,1,1,1,1,2,0,0,0],
        [0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0],
        [0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0],
        [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
        [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
        [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
        [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
];

let currentBodyIndex = 0;
let currentEyeStyle = 0;

function drawSlime() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bodyColor = colorPicker.value;
    
    const r = parseInt(bodyColor.substr(1, 2), 16);
    const g = parseInt(bodyColor.substr(3, 2), 16);
    const b = parseInt(bodyColor.substr(5, 2), 16);
    const outlineColor = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;
    
    // 밝기 계산 (어두우면 밝은 눈)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const eyeColor = luminance < 80 ? '#ffffff' : '#111111';

    const template = bodyTemplates[currentBodyIndex];

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const type = template[y][x];
            if (type === 0) continue;

            let color;
            switch(type) {
                case 1: color = bodyColor; break;
                case 2: color = outlineColor; break;
                case 4: color = '#ffffff'; break; // 하이라이트
            }

            ctx.fillStyle = color;
            ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
    }
    
    drawEyes(eyeColor);
}

function drawEyes(color) {
    ctx.fillStyle = color;
    
    // Body에 따른 눈 위치 (Classic, Wide, Tall)
    let eyeY = [9, 10, 9][currentBodyIndex]; 
    let leftX = 5, rightX = 10;
    
    if (currentBodyIndex === 1) { // Wide
        leftX = 4; rightX = 11; eyeY = 10;
    } else if (currentBodyIndex === 2) { // Tall
        leftX = 5; rightX = 10; eyeY = 9;
    }

    // 스타일: 0=기본(1x2), 1=점(1x1), 2=화남(대각선), 3=큰눈(2x2), 4=감은눈(2x1)
    if (currentEyeStyle === 0) {
        ctx.fillRect(leftX * PIXEL_SIZE, eyeY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE * 2);
        ctx.fillRect(rightX * PIXEL_SIZE, eyeY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE * 2);
    } else if (currentEyeStyle === 1) {
        ctx.fillRect(leftX * PIXEL_SIZE, eyeY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        ctx.fillRect(rightX * PIXEL_SIZE, eyeY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    } else if (currentEyeStyle === 2) { // 화난 눈
        ctx.fillRect((leftX) * PIXEL_SIZE, (eyeY) * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        ctx.fillRect((leftX-1) * PIXEL_SIZE, (eyeY-1) * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        ctx.fillRect((rightX) * PIXEL_SIZE, (eyeY) * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        ctx.fillRect((rightX+1) * PIXEL_SIZE, (eyeY-1) * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    } else if (currentEyeStyle === 3) {
        ctx.fillRect((leftX-1) * PIXEL_SIZE, eyeY * PIXEL_SIZE, PIXEL_SIZE*2, PIXEL_SIZE*2);
        ctx.fillRect((rightX-1) * PIXEL_SIZE, eyeY * PIXEL_SIZE, PIXEL_SIZE*2, PIXEL_SIZE*2);
    } else if (currentEyeStyle === 4) {
        ctx.fillRect((leftX-1) * PIXEL_SIZE, (eyeY+1) * PIXEL_SIZE, PIXEL_SIZE*2, PIXEL_SIZE);
        ctx.fillRect((rightX-1) * PIXEL_SIZE, (eyeY+1) * PIXEL_SIZE, PIXEL_SIZE*2, PIXEL_SIZE);
    }
}

function randomizeColor() {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    colorPicker.value = randomColor;
    currentBodyIndex = Math.floor(Math.random() * bodyTemplates.length);
    currentEyeStyle = Math.floor(Math.random() * 5);
    drawSlime();
}

generateBtn.addEventListener('click', randomizeColor);
colorPicker.addEventListener('input', drawSlime);

// 초기화
randomizeColor();
