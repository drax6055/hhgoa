import './style.css';
import { drawGraphic, RenderOptions } from './canvas/renderer';
import { processAndLoadImage } from './utils/imageLoader';

// Application State
const state: RenderOptions = {
  format: 'formatA',   // default to PFP Frame
  themeId: 'neon',
  userImage: null,
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  name: '',
  stackRole: '',
  builderTitle: ''
};

let mainCanvas: HTMLCanvasElement;
let toastTimeout: number | undefined;

function initApp() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <!-- Top Navbar -->
    <header class="navbar">
      <div class="brand-title">
        <span>HH GOA 2026</span>
        <span class="brand-badge">ID Builder Generator</span>
      </div>
      <div class="hashtag-tag">
        <span>#FrameInGoa</span>
      </div>
    </header>

    <div class="container">
      <!-- Hero Title -->
      <div class="hero-header">
        <h1>HH Goa 2026 Graphic Studio</h1>
        <p>Create your custom Builder Badge in seconds. Download and share on X with <strong>#FrameInGoa</strong>.</p>
      </div>

      <!-- Format Tabs -->
      <div class="format-tabs" role="tablist" aria-label="Format Selector">
        <button id="tabA" class="tab-btn active" role="tab" aria-selected="true" aria-controls="canvasWrapper" data-format="formatA">
          🖼️ PFP Frame
        </button>
        <button id="tabB" class="tab-btn" role="tab" aria-selected="false" aria-controls="canvasWrapper" data-format="formatB">
          🪪 Builder ID Card
        </button>
      </div>

      <!-- App Main Grid -->
      <div class="app-grid">
        <!-- Left Panel: Controls & Inputs -->
        <div class="card-panel">
          <h2 class="panel-title">
            <span>⚙️</span> Customization Controls
          </h2>

          <!-- Photo Upload Dropzone -->
          <div id="dropzone" class="dropzone" role="button" aria-label="Upload photo dropzone. Click or press enter to select an image." tabindex="0">
            <!-- State A: No image -->
            <div id="dropzone-empty">
              <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <div class="dropzone-title">Click or Drag Photo Here</div>
              <div class="dropzone-subtitle">Supports JPG, PNG, WebP &amp; iPhone HEIC</div>
            </div>
            <!-- State B: Image loaded (hidden by default) -->
            <div id="dropzone-loaded" style="display:none; width:100%; text-align:center;">
              <div style="position:relative; display:inline-block; margin-bottom:0.6rem;">
                <img id="dropzone-thumb" src="" alt="Uploaded photo thumbnail" width="90" height="90" style="width:90px; height:90px; object-fit:cover; border-radius:50%; border:3px solid var(--accent-yellow); box-shadow:var(--shadow-brutal-sm);" />
                <div style="position:absolute;bottom:0;right:0;background:var(--accent-magenta);border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px;" aria-hidden="true">✓</div>
              </div>
              <div class="dropzone-title" style="color:var(--accent-yellow); font-size:0.9rem;">Photo Loaded!</div>
              <div class="dropzone-subtitle" style="color:#fffbe8; font-size:0.82rem; margin-top:0.2rem;">Click to change photo</div>
            </div>
            <input type="file" id="fileInput" accept="image/*" aria-label="Choose photo file from device" style="display: none" />
          </div>

          <!-- Adjustments Sliders -->
          <div class="slider-row">
            <div class="slider-group">
              <label for="sliderZoom">Zoom <span id="valZoom">1.0x</span></label>
              <input type="range" id="sliderZoom" aria-label="Image zoom level" min="0.5" max="2.5" step="0.05" value="1.0" />
            </div>
            <div class="slider-group">
              <label for="sliderRotate">Rotate <span id="valRotate">0°</span></label>
              <input type="range" id="sliderRotate" aria-label="Image rotation degrees" min="-180" max="180" step="5" value="0" />
            </div>
          </div>

          <div class="slider-row">
            <div class="slider-group">
              <label for="sliderPanX">Pan X <span id="valPanX">0px</span></label>
              <input type="range" id="sliderPanX" aria-label="Image horizontal pan" min="-300" max="300" step="5" value="0" />
            </div>
            <div class="slider-group">
              <label for="sliderPanY">Pan Y <span id="valPanY">0px</span></label>
              <input type="range" id="sliderPanY" aria-label="Image vertical pan" min="-300" max="300" step="5" value="0" />
            </div>
          </div>

          <button id="btnResetAdjust" class="btn-secondary" aria-label="Reset image adjustments" style="width: 100%; margin-bottom: 1.5rem; justify-content: center;">
            <span>🔄</span> Reset Image Adjustments
          </button>

          <!-- Format B only: Input Fields -->
          <div id="formatBFields">
            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <label for="inputName" class="form-label" style="margin-bottom: 0;">Builder Name</label>
                <span id="countName" class="char-counter">${state.name.length}/15</span>
              </div>
              <input type="text" id="inputName" aria-label="Builder Name" class="form-input" value="${state.name}" maxlength="15" placeholder="e.g. Alex Rivera" />
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <label for="inputStack" class="form-label" style="margin-bottom: 0;">Role / Tech Stack</label>
                <span id="countStack" class="char-counter">${state.stackRole.length}/24</span>
              </div>
              <input type="text" id="inputStack" aria-label="Role or Tech Stack" class="form-input" value="${state.stackRole}" maxlength="24" placeholder="e.g. Fullstack, Rust &amp; Solana" />
            </div>
          </div>
        </div>

        <!-- Right Panel: Live Preview & Action Buttons -->
        <div class="card-panel preview-container">
          <h2 class="panel-title" style="width: 100%;">
           Live Graphic Preview
          </h2>

          <div id="canvasWrapper" class="canvas-wrapper">
            <canvas id="mainCanvas" aria-label="Generated graphic preview canvas"></canvas>
          </div>

          <div class="actions-row">
            <button id="btnDownload" class="btn-primary" aria-label="Download generated image file">
              <span>⬇️</span> Download
            </button>
            <button id="btnShareX" class="btn-x-share" aria-label="Share generated graphic to X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share to X
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="toast" class="toast" role="status" aria-live="polite" style="display: none"></div>
  `;

  mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement;

  // Set initial canvas aspect wrapper
  updateCanvasWrapper();

  bindEvents();
  render();
}

function updateCanvasWrapper() {
  const wrapper = document.getElementById('canvasWrapper');
  const formatBFields = document.getElementById('formatBFields');
  if (!wrapper) return;

  if (state.format === 'formatA') {
    // 4:5 portrait — matches the frame PNG natural ratio (1080×1350)
    wrapper.style.aspectRatio = '4 / 5';
    wrapper.style.maxWidth = '420px';
    if (formatBFields) formatBFields.style.display = 'none';
  } else {
    // 4:5 portrait — matches the Builder ID Card badge
    wrapper.style.aspectRatio = '4 / 5';
    wrapper.style.maxWidth = '420px';
    if (formatBFields) formatBFields.style.display = 'block';
  }
}

function bindEvents() {
  // ── Format tab switching ──
  document.getElementById('tabA')?.addEventListener('click', () => {
    state.format = 'formatA';
    document.getElementById('tabA')?.classList.add('active');
    document.getElementById('tabB')?.classList.remove('active');
    updateCanvasWrapper();
    render();
  });

  document.getElementById('tabB')?.addEventListener('click', () => {
    state.format = 'formatB';
    document.getElementById('tabB')?.classList.add('active');
    document.getElementById('tabA')?.classList.remove('active');
    updateCanvasWrapper();
    render();
  });

  // ── Dropzone & File Input ──
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;

  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone?.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer?.files.length) {
      await handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', async () => {
    if (fileInput.files?.length) {
      await handleFile(fileInput.files[0]);
    }
  });

  // ── Sliders ──
  const sZoom   = document.getElementById('sliderZoom')   as HTMLInputElement;
  const sRotate = document.getElementById('sliderRotate') as HTMLInputElement;
  const sPanX   = document.getElementById('sliderPanX')   as HTMLInputElement;
  const sPanY   = document.getElementById('sliderPanY')   as HTMLInputElement;

  sZoom?.addEventListener('input', () => {
    state.scale = parseFloat(sZoom.value);
    const valZoom = document.getElementById('valZoom');
    if (valZoom) valZoom.textContent = `${state.scale.toFixed(2)}x`;
    render();
  });

  sRotate?.addEventListener('input', () => {
    state.rotation = parseInt(sRotate.value);
    const valRotate = document.getElementById('valRotate');
    if (valRotate) valRotate.textContent = `${state.rotation}°`;
    render();
  });

  sPanX?.addEventListener('input', () => {
    state.offsetX = parseInt(sPanX.value);
    const valPanX = document.getElementById('valPanX');
    if (valPanX) valPanX.textContent = `${state.offsetX}px`;
    render();
  });

  sPanY?.addEventListener('input', () => {
    state.offsetY = parseInt(sPanY.value);
    const valPanY = document.getElementById('valPanY');
    if (valPanY) valPanY.textContent = `${state.offsetY}px`;
    render();
  });

  // ── Reset ──
  document.getElementById('btnResetAdjust')?.addEventListener('click', () => {
    state.scale = 1.0;
    state.rotation = 0;
    state.offsetX = 0;
    state.offsetY = 0;
    if (sZoom)   sZoom.value   = '1.0';
    if (sRotate) sRotate.value = '0';
    if (sPanX)   sPanX.value   = '0';
    if (sPanY)   sPanY.value   = '0';
    document.getElementById('valZoom')!.textContent   = '1.0x';
    document.getElementById('valRotate')!.textContent = '0°';
    document.getElementById('valPanX')!.textContent   = '0px';
    document.getElementById('valPanY')!.textContent   = '0px';
    render();
  });

  // ── Text inputs (Format B only) ──
  const inputName  = document.getElementById('inputName')  as HTMLInputElement;
  const inputStack = document.getElementById('inputStack') as HTMLInputElement;
  const countName  = document.getElementById('countName');
  const countStack = document.getElementById('countStack');

  inputName?.addEventListener('input', () => {
    if (inputName.value.length > 15) inputName.value = inputName.value.slice(0, 15);
    state.name = inputName.value;
    if (countName) countName.textContent = `${inputName.value.length}/15`;
    render();
  });

  inputStack?.addEventListener('input', () => {
    if (inputStack.value.length > 24) inputStack.value = inputStack.value.slice(0, 24);
    state.stackRole = inputStack.value;
    if (countStack) countStack.textContent = `${inputStack.value.length}/24`;
    render();
  });

  // ── Canvas Drag-to-Pan & Scroll-to-Zoom ──
  const canvasWrapper = document.getElementById('canvasWrapper');
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialOffsetX = 0;
  let initialOffsetY = 0;

  const startDrag = (clientX: number, clientY: number) => {
    if (!state.userImage) return;
    isDragging = true;
    startX = clientX;
    startY = clientY;
    initialOffsetX = state.offsetX;
    initialOffsetY = state.offsetY;
    if (canvasWrapper) canvasWrapper.style.cursor = 'grabbing';
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !canvasWrapper) return;
    const rect = canvasWrapper.getBoundingClientRect();
    const scaleFactor = 1080 / (rect.width || 420);
    const dx = Math.round((clientX - startX) * scaleFactor);
    const dy = Math.round((clientY - startY) * scaleFactor);

    state.offsetX = Math.max(-300, Math.min(300, initialOffsetX + dx));
    state.offsetY = Math.max(-300, Math.min(300, initialOffsetY + dy));

    if (sPanX) sPanX.value = state.offsetX.toString();
    if (sPanY) sPanY.value = state.offsetY.toString();
    const valPanX = document.getElementById('valPanX');
    const valPanY = document.getElementById('valPanY');
    if (valPanX) valPanX.textContent = `${state.offsetX}px`;
    if (valPanY) valPanY.textContent = `${state.offsetY}px`;
    render();
  };

  const stopDrag = () => {
    isDragging = false;
    if (canvasWrapper) canvasWrapper.style.cursor = 'grab';
  };

  canvasWrapper?.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
  window.addEventListener('mouseup', stopDrag);

  canvasWrapper?.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchend', stopDrag);

  canvasWrapper?.addEventListener('wheel', (e) => {
    if (!state.userImage) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    state.scale = Math.max(0.5, Math.min(2.5, parseFloat((state.scale + delta).toFixed(2))));
    if (sZoom) sZoom.value = state.scale.toString();
    const valZoom = document.getElementById('valZoom');
    if (valZoom) valZoom.textContent = `${state.scale.toFixed(2)}x`;
    render();
  }, { passive: false });

  if (canvasWrapper) canvasWrapper.style.cursor = 'grab';

  // ── Action Buttons ──
  document.getElementById('btnDownload')?.addEventListener('click', downloadGraphic);
  document.getElementById('btnShareX')?.addEventListener('click', shareToX);
}

let lastThumbUrl = '';

async function handleFile(file: File) {
  showToast('Processing photo...');
  try {
    const img = await processAndLoadImage(file);
    state.userImage = img;
    // Create a lightweight object URL for the thumbnail
    if (lastThumbUrl) URL.revokeObjectURL(lastThumbUrl);
    lastThumbUrl = URL.createObjectURL(file);
    updateDropzoneUI(lastThumbUrl);
    render();
    showToast('Photo loaded! 🎉');
  } catch (err) {
    console.error('File load error:', err);
    showToast('Failed to load image. Please try another file.');
  }
}

function updateDropzoneUI(src: string) {
  const empty  = document.getElementById('dropzone-empty');
  const loaded = document.getElementById('dropzone-loaded');
  const thumb  = document.getElementById('dropzone-thumb') as HTMLImageElement;
  const dz     = document.getElementById('dropzone');
  if (!empty || !loaded) return;

  if (src) {
    empty.style.display  = 'none';
    loaded.style.display = 'block';
    if (thumb) thumb.src = src;
    if (dz) dz.style.paddingTop = '1.2rem';
  } else {
    empty.style.display  = 'block';
    loaded.style.display = 'none';
    if (dz) dz.style.paddingTop = '';
  }
}

function render() {
  if (mainCanvas) {
    drawGraphic(mainCanvas, state);
  }
}

function downloadGraphic() {
  if (!mainCanvas) return;

  const rawName = state.name ? state.name.trim() : '';
  const sanitized = rawName
    ? rawName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    : state.format === 'formatA' ? 'pfp_frame' : 'builder';
  const filename = `${sanitized}_hhgoa2026.png`;

  if (mainCanvas.toBlob) {
    mainCanvas.toBlob((blob) => {
      if (!blob) { fallbackDataUrlDownload(filename); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', filename);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
      showToast(`Downloaded ${filename}! 🚀`);
    }, 'image/png', 1.0);
  } else {
    fallbackDataUrlDownload(filename);
  }
}

function fallbackDataUrlDownload(filename: string) {
  if (!mainCanvas) return;
  const dataUrl = mainCanvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = dataUrl;
  link.setAttribute('download', filename);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => { if (link.parentNode) link.parentNode.removeChild(link); }, 300);
  showToast(`Downloaded ${filename}! 🚀`);
}

async function shareToX() {
  if (!mainCanvas) return;

  const base64 = mainCanvas.toDataURL('image/png', 0.95);
  showToast('Preparing X share link...');

  let shareUrl = window.location.href;

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        format: state.format,
        name: state.name,
        builderTitle: state.builderTitle
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.shareUrl) shareUrl = data.shareUrl;
    }
  } catch (err) {
    console.warn('Backend share link endpoint unavailable, falling back to direct tweet intent:', err);
  }

  const caption = encodeURIComponent(
    state.format === 'formatA'
      ? 'Just created my HH Goa 2026 PFP frame! 🚀🌴 Join the builder community at #FrameInGoa'
      : 'Excited for HH Goa 2026! 🚀 Created my official Builder Badge with #FrameInGoa.'
  );

  const tweetIntentUrl = `https://x.com/intent/tweet?text=${caption}&url=${encodeURIComponent(shareUrl)}`;

  if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      mainCanvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'HH_Goa_2026.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'HH Goa 2026', text: 'Created my HH Goa 2026 graphic! #FrameInGoa', files: [file] });
            showToast('Shared successfully!');
            return;
          }
        }
        window.open(tweetIntentUrl, '_blank');
      }, 'image/png');
      return;
    } catch (e) {
      console.warn('Native share fallback:', e);
    }
  }

  window.open(tweetIntentUrl, '_blank');
  showToast('Opened X post draft with #FrameInGoa! 🐦');
}

function showToast(msg: string) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'flex';
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
