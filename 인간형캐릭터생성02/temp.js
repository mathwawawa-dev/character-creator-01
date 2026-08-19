
    // State
    const state = { head: 'head_01', body: 'body_01', weapon: 'weapon_01' };
    const partsLib = {
      head: ['head_01', 'head_02'],
      body: ['body_01'],
      weapon: ['weapon_01', '']
    };
    
    let currentTab = 'head';
    let loadedImages = {};

    function initSpum() {
      // Preload images
      let promises = [];
      for(let key in ASSETS) {
        promises.push(new Promise((resolve) => {
          let img = new Image();
          img.onload = () => { loadedImages[key] = img; resolve(); };
          img.src = ASSETS[key];
        }));
      }
      Promise.all(promises).then(() => {
        setTab('head');
        renderCanvas();
      });
    }

    function drawTinted(ctx, img, tintHex) {
      if(!img) return;
      if(tintHex === '#ffffff') {
        ctx.drawImage(img, 0, 0);
        return;
      }
      
      // Create offscreen canvas for tinting
      const offCvs = document.createElement('canvas');
      offCvs.width = img.width;
      offCvs.height = img.height;
      const offCtx = offCvs.getContext('2d');
      
      // Draw original image
      offCtx.drawImage(img, 0, 0);
      
      // Apply color tint using multiply
      offCtx.globalCompositeOperation = 'source-in';
      offCtx.fillStyle = tintHex;
      offCtx.fillRect(0, 0, offCvs.width, offCvs.height);
      
      // Re-apply original image with multiply to keep shading
      offCtx.globalCompositeOperation = 'multiply';
      offCtx.drawImage(img, 0, 0);
      
      // Re-apply alpha channel strictly from original image
      offCtx.globalCompositeOperation = 'destination-in';
      offCtx.drawImage(img, 0, 0);

      // Draw final result to main canvas
      ctx.drawImage(offCvs, 0, 0);
    }

    function renderCanvas() {
      const cvs = document.getElementById('charCanvas');
      const ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      
      // Scaling for sharp pixels
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.scale(2, 2); // 64x64 upscaled to 128x128

      const headTint = document.getElementById('tintHead').value;
      const bodyTint = document.getElementById('tintBody').value;

      // Layer Order: Body -> Head -> Weapon
      if(state.body && loadedImages[state.body]) drawTinted(ctx, loadedImages[state.body], bodyTint);
      if(state.head && loadedImages[state.head]) drawTinted(ctx, loadedImages[state.head], headTint);
      // Weapons are usually not tinted
      if(state.weapon && loadedImages[state.weapon]) ctx.drawImage(loadedImages[state.weapon], 0, 0);

      ctx.restore();
    }

    function setTab(cat) {
      currentTab = cat;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      event && event.target.classList.add('active');
      
      const grid = document.getElementById('partsGrid');
      grid.innerHTML = '';
      
      partsLib[cat].forEach(pKey => {
        let btn = document.createElement('div');
        btn.className = 'part-btn' + (state[cat] === pKey ? ' active' : '');
        btn.innerText = pKey || 'None';
        btn.onclick = () => {
          state[cat] = pKey;
          setTab(cat);
          renderCanvas();
        };
        grid.appendChild(btn);
      });
    }

    function randomize() {
      state.head = partsLib.head[Math.floor(Math.random()*partsLib.head.length)];
      state.weapon = partsLib.weapon[Math.floor(Math.random()*partsLib.weapon.length)];
      setTab(currentTab);
      renderCanvas();
    }

    function exportPNG() {
      const link = document.createElement('a');
      link.download = 'character.png';
      link.href = document.getElementById('charCanvas').toDataURL();
      link.click();
    }

    // Routing
    function selectMode(mode) {
      document.getElementById('startScreen').style.display = 'none';
      document.getElementById('appContainer').style.display = 'flex';
      
      const title = document.getElementById('headerTitle');
      const aiView = document.getElementById('aiModeView');
      const spumView = document.getElementById('spumModeView');
      
      if(mode === 'ai') {
        title.innerHTML = '🧠 통합 AI 생성 모드 (Prompt-to-Sprite)';
        aiView.style.display = 'flex';
        spumView.style.display = 'none';
      } else {
        title.innerHTML = '🧩 파츠 조립 모드 (SPUM Style)';
        aiView.style.display = 'none';
        spumView.style.display = 'flex';
        initSpum();
      }
    }

    function goHome() {
      document.getElementById('appContainer').style.display = 'none';
      document.getElementById('startScreen').style.display = 'flex';
    }

    // ==========================================
    // Step 3: Post-Processing (Alpha Cleanup) Logic
    // ==========================================
    let uploadedImg = null;

    // DOM 완전 로드 후 이벤트 연결 (startScreen 클릭 무반응 버그 원인 차단)
    window.addEventListener('DOMContentLoaded', function() {
      const imageUpload = document.getElementById('imageUpload');
      if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (!file) return;
          loadUploadedImage(URL.createObjectURL(file));
        });
      }
      // 모션 카탈로그 초기 렌더링 (DOM 준비 후 실행)
      filterMotionCategory('기본 동작', document.querySelector('#motionCatTabs .tab-btn'));
    });

    function loadUploadedImage(src) {
      const img = new Image();
      img.onload = function() {
        uploadedImg = img;
        const cvs = document.getElementById('cleanupCanvas');
        const ctx = cvs.getContext('2d');
        cvs.width = img.width;
        cvs.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = src;
    }

    // =============================================
    // REAL Image Generation (Pollinations Free + Gemini API)
    // =============================================
    async function generateAI() {
      const modelId = document.getElementById('modelSelect').value;
      const prompt = document.getElementById('aiPrompt').value;
      if (!prompt.trim()) {
        alert('프롬프트를 입력하세요.');
        return;
      }

      const apiKey = sessionStorage.getItem('geminiKey') || document.getElementById('apiKeyInput').value;
      if (modelId !== 'pollinations-pixel' && !apiKey) {
        alert('선택하신 모델은 🔑 Gemini API Key가 필요합니다. 상단에 키를 입력하거나 "무료 즉시 생성" 옵션을 선택하세요.');
        return;
      }

      
      const status = document.getElementById('aiStatus');
      const genBtn = document.querySelector('[onclick="generateAI()"]');
      status.style.display = 'block';
      status.style.color = '#f39c12';
      status.innerText = '⏳ AI 이미지 생성 요청 중... (잠시만 기다려주세요)';
      // const modelId = document.getElementById('modelSelect').value; (제거됨: 위에서 선언)
      const charDesc = prompt.trim();
      const motionAction = selectedPreset ? selectedPreset.action : 'side-view walking cycle facing right';
      const frameCount = selectedPreset ? selectedPreset.frames : 6;
      
      const enhancedPrompt = `Pixel art sprite sheet, exactly ${frameCount} frames in a single horizontal filmstrip row on a solid magenta (#FF00FF) background. Character: ${charDesc}. Action: ${motionAction}. Retro GBA 16-bit style, sharp clean outlines, no ground, character only, consistent character design across all ${frameCount} frames.`;

      try {
        let src = null;

        if (modelId === 'pollinations-pixel') {
          // 무료 즉시 생성 (API 키/쿼타 제한 없음)
          const seed = Math.floor(Math.random() * 1000000);
          const encoded = encodeURIComponent(enhancedPrompt);
          const url = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=128&seed=${seed}&nologo=true&model=flux`;
          
          // CORS 우회를 위해 이미지 Blob으로 패치
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('무료 AI 서버 응답 실패');
          const blob = await resp.blob();
          src = URL.createObjectURL(blob);
        } else if (modelId.startsWith('imagen-')) {
          // Imagen 전용 :predict 엔드포인트
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instances: [{ prompt: enhancedPrompt }],
                parameters: { sampleCount: 1, aspectRatio: '16:9' }
              })
            }
          );

          if (!response.ok) {
            const err = await response.json();
            const errMsg = err.error?.message || `HTTP ${response.status}`;
            throw new Error(errMsg);
          }

          const data = await response.json();
          const b64 = data.predictions?.[0]?.bytesBase64Encoded;
          const mime = data.predictions?.[0]?.mimeType || 'image/png';
          if (!b64) throw new Error('이미지 데이터를 받지 못했습니다.');
          src = `data:${mime};base64,${b64}`;
        } else {
          // Gemini 멀티모달 generateContent 엔드포인트
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: enhancedPrompt }] }],
                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
              })
            }
          );

          if (!response.ok) {
            const err = await response.json();
            const errMsg = err.error?.message || `HTTP ${response.status}`;
            const retryMatch = errMsg.match(/retry in ([0-9.]+)s/i);
            if (retryMatch) {
              let remainSec = Math.ceil(parseFloat(retryMatch[1]));
              startQuotaCountdown(remainSec);
              throw new Error(`API 쿼타가 소진되었습니다 (대기: ${remainSec}초). 무료 즉시 생성 옵션을 선택해보세요.`);
            }
            throw new Error(errMsg);
          }

          const data = await response.json();
          const imgPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (imgPart) {
            src = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
          }
        }

        if (!src) throw new Error('이미지 데이터를 받지 못했습니다.');

        status.innerText = '✅ 생성 완료! 배경 제거 및 프레임 슬라이싱 처리 중...';

        // 생성된 이미지 로드 후 YCbCr 배경 제거 자동 실행
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
          uploadedImg = img;
          const cvs = document.getElementById('cleanupCanvas');
          const ctx = cvs.getContext('2d');
          cvs.width = img.width;
          cvs.height = img.height;
          ctx.drawImage(img, 0, 0);

          // 마젠타 배경 자동 제거 (YCbCr 방식 - perfectpixel-studio 알고리즘)
          document.getElementById('chromaColor').value = '#FF00FF';
          processCleanupYCbCr();

          // 프레임 자동 슬라이싱 (sprite-gen Projection Profile 방식)
          autoSliceFrames();

          status.style.color = '#2ed573';
          status.innerText = '🎉 완료! AI 생성 + YCbCr 배경 제거 + 슬라이싱까지 처리되었습니다.';
          genBtn.disabled = false;
        };
        img.onerror = () => { status.innerText = '❌ 이미지 로드 실패'; genBtn.disabled = false; };
        img.src = src;

      } catch (e) {
        status.style.color = '#ff4757';
        status.innerHTML = `❌ 오류: ${e.message} <br><br>
          <button onclick="loadSampleSpriteSheet()" style="padding:6px 14px; background:#4a5568; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem; margin-top:5px;">
            🖼️ 샘플 픽셀 시트 로드 & 기능 테스트
          </button>`;
        genBtn.disabled = false;
      }
    }

    let countdownTimer = null;
    function startQuotaCountdown(seconds) {
      clearInterval(countdownTimer);
      let count = seconds;
      const status = document.getElementById('aiStatus');
      countdownTimer = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(countdownTimer);
          status.style.color = '#2ed573';
          status.innerHTML = `✅ 쿼타 쿨다운이 완료되었습니다! <b>🚀 AI 생성</b> 버튼을 다시 눌러보세요.`;
        }
      }, 1000);
    }

    // 쿼타 대기 중에도 배경 제거/슬라이싱 파이프라인을 검증할 수 있는 샘플 픽셀 시트 생성기
    function loadSampleSpriteSheet() {
      const tempCvs = document.createElement('canvas');
      tempCvs.width = 384; tempCvs.height = 64;
      const ctx = tempCvs.getContext('2d');
      
      // 배경: 순수 마젠타 (#FF00FF)
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(0, 0, 384, 64);
      
      // 6개 프레임의 귀여운 픽셀 캐릭터 그리기
      for(let f = 0; f < 6; f++) {
        const ox = f * 64 + 16;
        const oy = 12 + (f % 2 === 0 ? 0 : 2); // 걷는 모션 y축 변화
        
        // 몸통
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(ox, oy, 32, 36);
        ctx.fillStyle = '#1e90ff';
        ctx.fillRect(ox + 4, oy + 20, 24, 16);
        
        // 눈
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox + 8, oy + 8, 6, 6);
        ctx.fillRect(ox + 20, oy + 8, 6, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(ox + 10, oy + 10, 4, 4);
        ctx.fillRect(ox + 22, oy + 10, 4, 4);

        // 팔 (프레임별 움직임)
        ctx.fillStyle = '#ffa502';
        ctx.fillRect(ox - 2, oy + 14 + (f * 2 % 6), 4, 10);
        ctx.fillRect(ox + 30, oy + 18 - (f * 2 % 6), 4, 10);
      }
      
      loadUploadedImage(tempCvs.toDataURL());
      document.getElementById('chromaColor').value = '#FF00FF';
      processCleanupYCbCr();
      autoSliceFrames();
      
      const status = document.getElementById('aiStatus');
      status.style.display = 'block';
      status.style.color = '#2ed573';
      status.innerText = '✨ 6프레임 픽셀 시트 샘플이 로드되어 YCbCr 배경 제거 및 슬라이싱이 자동 적용되었습니다!';
    }

    // =============================================
    // YCbCr 기반 배경 제거 (perfectpixel-studio 핵심 알고리즘)
    // RGB → YCbCr 변환 후 크로마(Cb,Cr)만으로 배경 판별
    // → 루마(밝기)를 무시하므로 음영 있는 마젠타도 제거 가능
    // =============================================
    function processCleanupYCbCr() {
      if (!uploadedImg) return;

      const hex = document.getElementById('chromaColor').value;
      const tol = parseInt(document.getElementById('tolerance').value, 10);

      const rKey = parseInt(hex.slice(1,3), 16);
      const gKey = parseInt(hex.slice(3,5), 16);
      const bKey = parseInt(hex.slice(5,7), 16);

      // 키 색의 Cb, Cr 계산
      const CbKey = 128 + (-0.168736*rKey - 0.331264*gKey + 0.5*bKey);
      const CrKey = 128 + (0.5*rKey - 0.418688*gKey - 0.081312*bKey);

      const cvs = document.getElementById('cleanupCanvas');
      const ctx = cvs.getContext('2d');
      ctx.drawImage(uploadedImg, 0, 0);

      const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        if (data[i+3] === 0) continue;

        // RGB → YCbCr
        const Cb = 128 + (-0.168736*r - 0.331264*g + 0.5*b);
        const Cr = 128 + (0.5*r - 0.418688*g - 0.081312*b);

        // 크로마 거리만으로 배경 판별 (루마/밝기 무시)
        const chromaDist = Math.sqrt((Cb - CbKey)**2 + (Cr - CrKey)**2);
        if (chromaDist <= tol * 0.8) {
          data[i+3] = 0; // 완전 투명
        } else if (chromaDist <= tol * 1.5) {
          // 경계 Soft Alpha (Hermite smoothstep - perfectpixel-studio)
          const t = (chromaDist - tol * 0.8) / (tol * 0.7);
          data[i+3] = Math.round(255 * (3*t*t - 2*t*t*t));
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }

    // =============================================
    // 프레임 자동 슬라이싱 (sprite-gen Projection Profile 방식)
    // Vertical alpha projection → valley detection → 프레임 분리
    // =============================================
    function autoSliceFrames() {
      const src = document.getElementById('cleanupCanvas');
      if (!src) return;

      const W = src.width, H = src.height;
      const ctx = src.getContext('2d');
      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;

      // 1) Vertical Projection: 각 x열의 alpha 합산
      const proj = new Float32Array(W);
      for (let x = 0; x < W; x++) {
        let sum = 0;
        for (let y = 0; y < H; y++) {
          sum += data[(y * W + x) * 4 + 3]; // alpha
        }
        proj[x] = sum;
      }

      // 2) Valley detection: projection이 낮은 곳 = 프레임 경계
      const threshold = (Math.max(...proj) * 0.08); // 최대값의 8% 이하 = valley
      const sliceLines = [];
      let inValley = false;
      for (let x = 1; x < W - 1; x++) {
        if (proj[x] <= threshold && !inValley) {
          sliceLines.push(x);
          inValley = true;
        } else if (proj[x] > threshold) {
          inValley = false;
        }
      }

      if (sliceLines.length === 0) {
        document.getElementById('aiStatus').innerText += ' (단일 프레임 감지됨)';
        return;
      }

      // 3) 감지된 슬라이스 라인을 시각화 (빨간 세로선)
      const overlay = document.getElementById('sliceOverlayCanvas');
      if (!overlay) return;
      overlay.width = W; overlay.height = H;
      const octx = overlay.getContext('2d');
      octx.drawImage(src, 0, 0);
      octx.strokeStyle = 'rgba(255,71,87,0.8)';
      octx.lineWidth = 1;
      sliceLines.forEach(x => {
        octx.beginPath(); octx.moveTo(x, 0); octx.lineTo(x, H); octx.stroke();
      });

      document.getElementById('sliceInfo').innerText =
        `🔪 ${sliceLines.length + 1}개 프레임 감지 완료 (실시간 재생 시작)`;
      document.getElementById('sliceSection').style.display = 'block';

      // 4) perfectpixel-studio 핵심: 각 프레임을 알파 가중 무게중심(Alpha Centroid)으로 정렬하여 추출
      extractAndPlayFrames(src, sliceLines);
    }

    // =============================================
    // perfectpixel-studio: 알파 가중 무게중심 정렬 & 실시간 애니메이션 재생기
    // =============================================
    let extractedFrames = [];
    let animTimer = null;
    let currentAnimFrame = 0;

    function extractAndPlayFrames(srcCanvas, sliceLines) {
      clearInterval(animTimer);
      extractedFrames = [];
      const srcCtx = srcCanvas.getContext('2d');
      const W = srcCanvas.width;
      const H = srcCanvas.height;

      const boundaries = [0, ...sliceLines, W];
      
      for (let i = 0; i < boundaries.length - 1; i++) {
        const x1 = boundaries[i];
        const x2 = boundaries[i+1];
        const spanW = x2 - x1;
        if (spanW < 8) continue; // 너무 얇은 슬라이스 제외

        const frameImgData = srcCtx.getImageData(x1, 0, spanW, H);
        const data = frameImgData.data;

        // 알파 가중 무게중심(Centroid) 및 바운딩 박스 계산
        let sumWX = 0, sumWY = 0, sumW = 0;
        let minX = spanW, maxX = 0, minY = H, maxY = 0;

        for (let x = 0; x < spanW; x++) {
          for (let y = 0; y < H; y++) {
            const a = data[(y * spanW + x) * 4 + 3];
            if (a > 15) {
              sumWX += x * a;
              sumWY += y * a;
              sumW += a;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (sumW === 0) continue; // 빈 프레임

        const cx = sumWX / sumW; // 질량 중심 X
        const cy = sumWY / sumW; // 질량 중심 Y

        // 정규화된 96x96 셀 캔버스에 무게중심을 중앙(48, 48)에 맞춰 복사
        const cellCvs = document.createElement('canvas');
        cellCvs.width = 96; cellCvs.height = 96;
        const cellCtx = cellCvs.getContext('2d');
        cellCtx.imageSmoothingEnabled = false;

        const targetX = 48 - Math.round(cx);
        const targetY = 48 - Math.round(cy);

        // 오프스크린 임시 캔버스
        const rawCvs = document.createElement('canvas');
        rawCvs.width = spanW; rawCvs.height = H;
        rawCvs.getContext('2d').putImageData(frameImgData, 0, 0);

        cellCtx.drawImage(rawCvs, targetX, targetY);
        extractedFrames.push(cellCvs);
      }

      if (extractedFrames.length > 0) {
        startLiveAnimation();
      }
    }

    function startLiveAnimation() {
      const animCvs = document.getElementById('animCanvas');
      const animCtx = animCvs.getContext('2d');
      animCtx.imageSmoothingEnabled = false;

      const fps = selectedPreset ? selectedPreset.fps : 10;
      document.getElementById('fpsVal').innerText = fps;

      currentAnimFrame = 0;
      animTimer = setInterval(() => {
        if (extractedFrames.length === 0) return;
        animCtx.clearRect(0, 0, 96, 96);
        animCtx.drawImage(extractedFrames[currentAnimFrame], 0, 0);
        currentAnimFrame = (currentAnimFrame + 1) % extractedFrames.length;
      }, 1000 / fps);
    }

    // =============================================
    // 100+ 모션 프리셋 카탈로그 데이터 및 UI 렌더러
    // =============================================
    const MOTION_CATALOG = [
      // 기본 동작
      { name:'idle', label:'대기', cat:'기본 동작', action:'subtle breathing idle standing in place', frames:4, fps:6, hint:'gentle chest rise and fall' },
      { name:'idle-combat', label:'전투 대기', cat:'기본 동작', action:'ready combat stance, weapon up', frames:4, fps:8, hint:'alert ready pose' },
      { name:'walk', label:'걷기', cat:'기본 동작', action:'side-view walking cycle facing right', frames:6, fps:10, hint:'alternating legs with passing poses' },
      { name:'run', label:'달리기', cat:'기본 동작', action:'fast side-view running cycle facing right', frames:6, fps:12, hint:'strong forward lean' },
      { name:'sprint', label:'전력 질주', cat:'기본 동작', action:'all-out sprint, extreme lean and stride', frames:6, fps:14, hint:'maximal leg extension' },
      { name:'jump', label:'점프', cat:'기본 동작', action:'crouch, take off, airborne peak, land', frames:5, fps:10, hint:'jump arc' },
      { name:'dash', label:'대시', cat:'기본 동작', action:'quick burst dash forward', frames:4, fps:14, hint:'explosive forward push' },
      { name:'roll', label:'구르기', cat:'기본 동작', action:'evasive forward roll', frames:5, fps:14, hint:'rotate fully over shoulder' },
      { name:'climb', label:'오르기', cat:'기본 동작', action:'climb up a vertical surface', frames:6, fps:8, hint:'alternating hand reaches' },
      { name:'sit', label:'앉기', cat:'기본 동작', action:'sit down to the ground', frames:4, fps:8, hint:'settle onto ground' },
      
      // 전투
      { name:'attack', label:'기본 공격', cat:'전투', action:'melee attack with wind-up, strike, recovery', frames:5, fps:12, hint:'powerful strike at full extension' },
      { name:'attack-heavy', label:'강공격', cat:'전투', action:'slow heavy melee attack with big wind-up', frames:6, fps:10, hint:'long exaggerated wind-up' },
      { name:'combo', label:'연속 공격', cat:'전투', action:'multi-hit melee combo', frames:6, fps:14, hint:'fast sequence of strikes' },
      { name:'slash', label:'검 베기', cat:'전투', action:'horizontal sword slash', frames:5, fps:14, hint:'sweep in wide arc' },
      { name:'stab', label:'찌르기', cat:'전투', action:'forward thrust attack', frames:4, fps:14, hint:'explosive straight lunge' },
      { name:'punch', label:'주먹 지르기', cat:'전투', action:'straight punch with shoulder rotation', frames:4, fps:14, hint:'cock fist back and drive' },
      { name:'kick', label:'발차기', cat:'전투', action:'high kick at full leg extension', frames:5, fps:14, hint:'snap leg out to impact' },
      { name:'block', label:'방어/막기', cat:'전투', action:'defensive block with shield or guard', frames:3, fps:10, hint:'brace with slight crouch' },
      { name:'parry', label:'패링', cat:'전투', action:'deflect an incoming attack sharply', frames:4, fps:16, hint:'sharp deflecting flick' },
      { name:'shoot', label:'원거리 사격', cat:'전투', action:'fire a ranged weapon with recoil', frames:4, fps:14, hint:'sharp recoil kick' },
      
      // 마법·스킬
      { name:'cast', label:'일반 시전', cat:'마법·스킬', action:'generic spell casting with arms thrust', frames:5, fps:12, hint:'gather inward then thrust' },
      { name:'cast-fire', label:'화염 시전', cat:'마법·스킬', action:'cast a fire spell with burst release', frames:6, fps:12, hint:'opaque hard-edged flames' },
      { name:'cast-lightning', label:'번개 시전', cat:'마법·스킬', action:'fast raise of arm overhead and strike', frames:5, fps:14, hint:'downward lightning bolt' },
      { name:'cast-heal', label:'치유 시전', cat:'마법·스킬', action:'healing spell with soft rising motion', frames:5, fps:8, hint:'bring hands to chest' },
      { name:'power-up', label:'기 모으기', cat:'마법·스킬', action:'powering up with surging energy pose', frames:5, fps:10, hint:'braced wide stance fists clenched' },
      { name:'teleport', label:'순간이동', cat:'마법·스킬', action:'silhouette compression vanish and reappear', frames:5, fps:14, hint:'compress shrinking away' },
      
      // 피해·상태이상
      { name:'hurt', label:'피격', cat:'피해·상태이상', action:'recoil from being hit backward', frames:3, fps:10, hint:'body recoils head snaps' },
      { name:'knockback', label:'넉백', cat:'피해·상태이상', action:'launched backward through air', frames:4, fps:12, hint:'tumbling backward stop' },
      { name:'stun', label:'기절/스턴', cat:'피해·상태이상', action:'dazed slumped posture wobbling', frames:4, fps:8, hint:'looping dazed wobble' },
      { name:'death', label:'사망', cat:'피해·상태이상', action:'stagger collapse lie flat on ground', frames:5, fps:8, hint:'final frame lying flat' },
      
      // 감정·표현
      { name:'wave', label:'손 흔들기', cat:'감정·표현', action:'friendly hand wave side to side', frames:4, fps:8, hint:'arm raises and waves' },
      { name:'taunt', label:'도발', cat:'감정·표현', action:'confident provoking taunt gesture', frames:4, fps:8, hint:'beckoning with hand' },
      { name:'victory', label:'승리 포즈', cat:'감정·표현', action:'raise weapon in victory triumph', frames:4, fps:8, hint:'cheering triumphant' }
    ];

    let selectedPreset = MOTION_CATALOG[2]; // 기본: walk

    function filterMotionCategory(cat, btnEl) {
      document.querySelectorAll('#motionCatTabs .tab-btn').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');

      const grid = document.getElementById('motionPresetsGrid');
      grid.innerHTML = '';

      MOTION_CATALOG.filter(p => p.cat === cat).forEach(p => {
        const b = document.createElement('button');
        b.style.cssText = `padding:6px 12px; background:${selectedPreset.name === p.name ? 'var(--accent)' : 'var(--bg)'}; color:white; border:1px solid var(--border); border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:bold; transition:all 0.15s;`;
        b.innerText = `${p.label} (${p.frames}F)`;
        b.onclick = () => {
          selectedPreset = p;
          document.getElementById('selectedMotionLabel').innerText = `선택된 모션: ${p.label} (${p.name}, ${p.frames}프레임, ${p.fps}fps)`;
          filterMotionCategory(cat, btnEl);
        };
        grid.appendChild(b);
      });
    }

  