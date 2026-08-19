const canvas = document.getElementById('slimeCanvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generateBtn');
const colorPicker = document.getElementById('slimeColor');

const GRID_SIZE = 16;
const PIXEL_SIZE = canvas.width / GRID_SIZE;

// 16x16 슬라임 기본 템플릿 (0: 빈공간, 1: 몸통, 2: 외곽선, 3: 눈, 4: 하이라이트)
const slimeTemplate = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
    [0,0,0,0,0,2,1,4,1,1,2,0,0,0,0,0],
    [0,0,0,0,2,1,1,1,1,1,1,2,0,0,0,0],
    [0,0,0,2,1,1,1,1,1,1,1,1,2,0,0,0],
    [0,0,2,1,1,3,1,1,1,1,3,1,1,2,0,0],
    [0,2,1,1,1,3,1,1,1,1,3,1,1,1,2,0],
    [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
    [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
    [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
    [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

function drawSlime() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bodyColor = colorPicker.value;
    
    // 약간 어두운 외곽선 색상 계산
    const r = parseInt(bodyColor.substr(1, 2), 16);
    const g = parseInt(bodyColor.substr(3, 2), 16);
    const b = parseInt(bodyColor.substr(5, 2), 16);
    const outlineColor = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const type = slimeTemplate[y][x];
            if (type === 0) continue;

            let color;
            switch(type) {
                case 1: color = bodyColor; break;
                case 2: color = outlineColor; break;
                case 3: color = '#111111'; break; // 눈
                case 4: color = '#ffffff'; break; // 하이라이트
            }

            ctx.fillStyle = color;
            ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
    }
}

function randomizeColor() {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    colorPicker.value = randomColor;
    drawSlime();
}

generateBtn.addEventListener('click', randomizeColor);
colorPicker.addEventListener('input', drawSlime);

// 초기화
drawSlime();
