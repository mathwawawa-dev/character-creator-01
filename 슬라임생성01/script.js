let eyeOffsetX = 0;
let eyeOffsetY = 0;
const canvas = document.getElementById('slimeCanvas');
const ctx = canvas.getContext('2d');
// Canvas 내부 해상도를 32x32로 고정. CSS로 256px로 렌더링됨
canvas.width = 32;
canvas.height = 32;

const generateBtn = document.getElementById('generateBtn');
const colorPicker = document.getElementById('slimeColor');
const bodySelect = document.getElementById('bodySelect');
const eyeSelect = document.getElementById('eyeSelect');

function shadeColor(color, percent) {
    let r = parseInt(color.substring(1,3), 16);
    let g = parseInt(color.substring(3,5), 16);
    let b = parseInt(color.substring(5,7), 16);
    r = parseInt(r * (100 + percent) / 100);
    g = parseInt(g * (100 + percent) / 100);
    b = parseInt(b * (100 + percent) / 100);
    r = (r<255)?(r>0?r:0):255;
    g = (g<255)?(g>0?g:0):255;
    b = (b<255)?(b>0?b:0):255;
    return `#${(r.toString(16).padStart(2,'0'))}${(g.toString(16).padStart(2,'0'))}${(b.toString(16).padStart(2,'0'))}`;
}

// 32x32 절차적 바디 픽셀 생성기
function getBodyPixels(type) {
    const body = Array.from({length: 32}, () => Array(32).fill(0));
    const cx = 15.5;
    const cy = 18;

    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
            let dx = x - cx;
            let dy = y - cy;
            
            let dist = 0;
            let radius = 10;
            
            if (type === 0) { // Classic
                dist = Math.sqrt(dx*dx + (dy*0.8)**2);
                radius = 11;
                if (dy > 0) radius += dy * 0.15; 
                if (dy > 8) radius -= (dy - 8) * 0.9;
            } else if (type === 1) { // Droplet
                dist = Math.sqrt(dx*dx + (dy*0.8)**2);
                radius = 10;
                if (dy < 0) radius += dy * 0.55; 
                if (dy > 8) radius -= (dy - 8) * 0.8;
            } else if (type === 2) { // Wide
                dist = Math.sqrt((dx*0.65)**2 + dy**2);
                radius = 9;
                if (dy > 5) radius -= (dy - 5) * 1.5;
            } else if (type === 3) { // Spiky
                dist = Math.sqrt(dx*dx + (dy*0.8)**2);
                radius = 10;
                let angle = Math.atan2(dy, dx);
                dist -= Math.sin(angle * 8) * 1.8; 
                if (dy > 8) radius -= (dy - 8) * 0.8; 
            } else if (type === 4) { // Fire
                dist = Math.sqrt(dx*dx + (dy*0.9)**2);
                radius = 10;
                if (dy < 0) {
                    let angle = Math.atan2(dy, dx);
                    dist -= Math.sin(angle * 3) * 2.5; // Flame tips
                }
                if (dy > 8) radius -= (dy - 8) * 0.8;
            } else if (type === 5) { // Water (Tentacles)
                dist = Math.sqrt(dx*dx + (dy*0.8)**2);
                radius = 10;
                if (dy > 5) dist -= Math.abs(Math.sin(dx * 1.2)) * 1.5;
                if (dy > 8) radius -= (dy - 8) * 0.5;
            } else if (type === 6) { // Grass (Leaf on top)
                dist = Math.sqrt(dx*dx + (dy*0.8)**2);
                radius = 10;
                if (dy < -8 && Math.abs(dx - dy*0.5) < 3) radius += 4; // Stem/leaf
                if (dy > 8) radius -= (dy - 8) * 0.9;
            } else if (type === 7) { // Lightning (Jagged)
                dist = Math.sqrt(dx*dx + (dy*0.8)**2);
                radius = 10;
                dist += (Math.abs(dx % 4 - 2) + Math.abs(dy % 4 - 2)) * 0.6;
                if (dy > 8) radius -= (dy - 8) * 0.9;
            } else if (type === 8) { // Rock (Blocky)
                dist = Math.max(Math.abs(dx*0.9), Math.abs(dy*0.8));
                radius = 9;
                if (dx > 5 && dy < -5) dist += 2; // chipped corner
                if (dy > 8) radius -= (dy - 8) * 0.9;
            } else if (type === 9) { // Ice (Diamond)
                dist = Math.abs(dx*0.8) + Math.abs(dy*0.7);
                radius = 12;
                if (dy > 8) radius -= (dy - 8) * 1.2;
            } else if (type === 10) { // Dark (Ghost tail)
                let tx = dx;
                if (dy > 0) tx += Math.sin(dy * 0.5) * 2; // Wavy tail
                dist = Math.sqrt(tx*tx + (dy*0.8)**2);
                radius = 10;
                if (dy > 5) radius -= dy * 0.6; // Tapering
            } else if (type === 11) { // Light (Star/Wings)
                let angle = Math.atan2(dy, dx);
                dist = Math.sqrt(dx*dx + (dy*0.8)**2);
                dist -= Math.cos(angle * 6) * 1.5; // 6 points
                radius = 10;
                if (dy > 8) radius -= (dy - 8) * 0.9;
            } else if (type === 12) { // Wind (Tornado swirl)
                let tx = dx + Math.sin(dy * 0.8) * (dy > 0 ? dy * 0.15 : 0);
                dist = Math.sqrt(tx*tx + (dy*0.8)**2);
                radius = 10;
                if (dy > 4) {
                    radius -= dy * 0.4;
                    dist += (Math.abs(dy % 3 - 1)) * 0.5; // Swirl lines
                }
            }

            if (dist < radius) {
                body[y][x] = 1; // base
                
                // highlight (top-left)
                if (dx < -radius*0.3 && dx > -radius*0.8 && dy < -radius*0.3 && dy > -radius*0.8) {
                    body[y][x] = 3; 
                }
                // shadow (bottom and right edges)
                else if (dist > radius * 0.75 || dy > radius * 0.5) {
                    body[y][x] = 4;
                }
            }
        }
    }
    
    // 외곽선(2) 추가 (이중 패스)
    const finalPixels = Array.from({length: 32}, () => Array(32).fill(0));
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
            finalPixels[y][x] = body[y][x];
            if (body[y][x] === 0) {
                let isOutline = false;
                for (let ny = Math.max(0, y-1); ny <= Math.min(31, y+1); ny++) {
                    for (let nx = Math.max(0, x-1); nx <= Math.min(31, x+1); nx++) {
                        if (body[ny][nx] > 0) isOutline = true;
                    }
                }
                if (isOutline) finalPixels[y][x] = 2; // outline
            }
        }
    }
    return finalPixels;
}

function drawEyes(eyeColor, bodyType, eyeType) {
    ctx.fillStyle = eyeColor;
    
    let eyeY = 16;
    let leftX = 10;
    let rightX = 20;

    if (bodyType === 2) { eyeY = 19; leftX = 9; rightX = 21; } // Wide
    if (bodyType === 1) { eyeY = 17; leftX = 11; rightX = 19; } // Droplet

    eyeY += eyeOffsetY;
    leftX += eyeOffsetX;
    rightX += eyeOffsetX;

    const drawRect = (x, y, w, h) => ctx.fillRect(x, y, w, h);

    if (eyeType === 0) { // Normal 2x4
        drawRect(leftX, eyeY, 2, 4);
        drawRect(rightX, eyeY, 2, 4);
    } else if (eyeType === 1) { // Dots 2x2
        drawRect(leftX, eyeY+1, 2, 2);
        drawRect(rightX, eyeY+1, 2, 2);
    } else if (eyeType === 2) { // Angry
        drawRect(leftX, eyeY, 2, 4);
        drawRect(leftX-1, eyeY-1, 3, 2);
        drawRect(rightX, eyeY, 2, 4);
        drawRect(rightX, eyeY-1, 3, 2);
    } else if (eyeType === 3) { // Big 4x4
        drawRect(leftX-1, eyeY-1, 4, 4);
        drawRect(rightX-1, eyeY-1, 4, 4);
    } else if (eyeType === 4) { // Closed 4x2
        drawRect(leftX-1, eyeY+2, 4, 2);
        drawRect(rightX-1, eyeY+2, 4, 2);
    } else if (eyeType === 5) { // Half-closed 3x2
        drawRect(leftX, eyeY+1, 3, 2);
        drawRect(rightX-1, eyeY+1, 3, 2);
    } else if (eyeType === 6) { // Cyclops
        drawRect(14 + eyeOffsetX, eyeY-1, 4, 4);
    }
}

function drawSlime() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bodyColor = colorPicker.value;
    const bType = parseInt(bodySelect.value);
    const eType = parseInt(eyeSelect.value);
    
    const outlineColor = shadeColor(bodyColor, -60);
    const shadowColor = shadeColor(bodyColor, -30);
    const highlightColor = shadeColor(bodyColor, 40);
    
    // 밝기 계산
    const r = parseInt(bodyColor.substr(1, 2), 16);
    const g = parseInt(bodyColor.substr(3, 2), 16);
    const b = parseInt(bodyColor.substr(5, 2), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const eyeColor = luminance < 90 ? '#ffffff' : '#111111';

    const pixels = getBodyPixels(bType);

    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
            const p = pixels[y][x];
            if (p === 0) continue;

            if (p === 1) ctx.fillStyle = bodyColor;
            else if (p === 2) ctx.fillStyle = outlineColor;
            else if (p === 3) ctx.fillStyle = highlightColor;
            else if (p === 4) ctx.fillStyle = shadowColor;
            
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    drawEyes(eyeColor, bType, eType);
}

function randomizeAll() {
    colorPicker.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    bodySelect.value = Math.floor(Math.random() * 13);
    eyeSelect.value = Math.floor(Math.random() * 7);
    drawSlime();
}

generateBtn.addEventListener('click', randomizeAll);
colorPicker.addEventListener('input', drawSlime);
bodySelect.addEventListener('change', () => { eyeOffsetX=0; eyeOffsetY=0; drawSlime(); });
eyeSelect.addEventListener('change', drawSlime);

document.getElementById('eyeUpBtn').addEventListener('click', () => { eyeOffsetY -= 1; drawSlime(); });
document.getElementById('eyeDownBtn').addEventListener('click', () => { eyeOffsetY += 1; drawSlime(); });
document.getElementById('eyeLeftBtn').addEventListener('click', () => { eyeOffsetX -= 1; drawSlime(); });
document.getElementById('eyeRightBtn').addEventListener('click', () => { eyeOffsetX += 1; drawSlime(); });

// 초기 렌더링
drawSlime();
