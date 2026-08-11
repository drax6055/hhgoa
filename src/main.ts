import './style.css';
import { drawGraphic, RenderOptions } from './canvas/renderer';
import { processAndLoadImage } from './utils/imageLoader';

// Application State
// Application State
const state: RenderOptions = {
  format: 'formatB',
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
        <span style="font-size: 1.6rem">🚀</span>
        <span>HH GOA 2026</span>
        <span class="brand-badge">Official Generator</span>
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

      <!-- App Main Grid -->
      <div class="app-grid">
        <!-- Left Panel: Controls & Inputs -->
        <div class="card-panel">
          <h2 class="panel-title">
            <span>⚙️</span> Customization Controls
          </h2>

          <!-- Photo Upload Dropzone -->
          <div id="dropzone" class="dropzone">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <div class="dropzone-title">Click or Drag Photo Here</div>
            <div class="dropzone-subtitle">Supports JPG, PNG, WebP & iPhone HEIC</div>
            <input type="file" id="fileInput" accept="image/*" style="display: none" />
          </div>

          <!-- Adjustments Sliders -->
          <div class="slider-row">
            <div class="slider-group">
              <label>Zoom <span id="valZoom">1.0x</span></label>
              <input type="range" id="sliderZoom" min="0.5" max="2.5" step="0.05" value="1.0" />
            </div>
            <div class="slider-group">
              <label>Rotate <span id="valRotate">0°</span></label>
              <input type="range" id="sliderRotate" min="-180" max="180" step="5" value="0" />
            </div>
          </div>

          <div class="slider-row">
            <div class="slider-group">
              <label>Pan X <span id="valPanX">0px</span></label>
              <input type="range" id="sliderPanX" min="-300" max="300" step="5" value="0" />
            </div>
            <div class="slider-group">
              <label>Pan Y <span id="valPanY">0px</span></label>
              <input type="range" id="sliderPanY" min="-300" max="300" step="5" value="0" />
            </div>
          </div>

          <button id="btnResetAdjust" class="btn-secondary" style="width: 100%; margin-bottom: 1.5rem; justify-content: center;">
            <span>🔄</span> Reset Image Adjustments
          </button>

          <!-- Input Fields -->
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label class="form-label" style="margin-bottom: 0;">Builder Name</label>
              <span id="countName" class="char-counter">${state.name.length}/15</span>
            </div>
            <input type="text" id="inputName" class="form-input" value="${state.name}" maxlength="15" placeholder="e.g. Alex Rivera" />
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label class="form-label" style="margin-bottom: 0;">Role / Tech Stack</label>
              <span id="countStack" class="char-counter">${state.stackRole.length}/24</span>
            </div>
            <input type="text" id="inputStack" class="form-input" value="${state.stackRole}" maxlength="24" placeholder="e.g. Fullstack, Rust & Solana" />
          </div>
        </div>

        <!-- Right Panel: Live Preview & Action Buttons -->
        <div class="card-panel preview-container">
          <h2 class="panel-title" style="width: 100%;">
            <span>👁️</span> Live Graphic Preview
          </h2>

          <div id="canvasWrapper" class="canvas-wrapper badge-aspect">
            <canvas id="mainCanvas"></canvas>
          </div>

          <div class="actions-row">
            <button id="btnDownload" class="btn-primary">
              <span>⬇️</span> Download High-Res PNG
            </button>
            <button id="btnShareX" class="btn-x-share">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share to X
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="toast" class="toast" style="display: none"></div>
  `;

  mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
  bindEvents();
  render();
}

function bindEvents() {
  // Dropzone & File Input
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

  // Sliders
  const sZoom = document.getElementById('sliderZoom') as HTMLInputElement;
  const sRotate = document.getElementById('sliderRotate') as HTMLInputElement;
  const sPanX = document.getElementById('sliderPanX') as HTMLInputElement;
  const sPanY = document.getElementById('sliderPanY') as HTMLInputElement;

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

  // Reset Button
  document.getElementById('btnResetAdjust')?.addEventListener('click', () => {
    state.scale = 1.0;
    state.rotation = 0;
    state.offsetX = 0;
    state.offsetY = 0;
    if (sZoom) sZoom.value = '1.0';
    if (sRotate) sRotate.value = '0';
    if (sPanX) sPanX.value = '0';
    if (sPanY) sPanY.value = '0';
    document.getElementById('valZoom')!.textContent = '1.0x';
    document.getElementById('valRotate')!.textContent = '0°';
    document.getElementById('valPanX')!.textContent = '0px';
    document.getElementById('valPanY')!.textContent = '0px';
    render();
  });

  // Inputs
  const inputName = document.getElementById('inputName') as HTMLInputElement;
  const inputStack = document.getElementById('inputStack') as HTMLInputElement;
  const countName = document.getElementById('countName');
  const countStack = document.getElementById('countStack');

  inputName?.addEventListener('input', () => {
    if (inputName.value.length > 15) {
      inputName.value = inputName.value.slice(0, 15);
    }
    state.name = inputName.value;
    if (countName) countName.textContent = `${inputName.value.length}/15`;
    render();
  });

  inputStack?.addEventListener('input', () => {
    if (inputStack.value.length > 24) {
      inputStack.value = inputStack.value.slice(0, 24);
    }
    state.stackRole = inputStack.value;
    if (countStack) countStack.textContent = `${inputStack.value.length}/24`;
    render();
  });

  // Action Buttons
  document.getElementById('btnDownload')?.addEventListener('click', downloadGraphic);
  document.getElementById('btnShareX')?.addEventListener('click', shareToX);
}

async function handleFile(file: File) {
  showToast('Processing photo...');
  try {
    const img = await processAndLoadImage(file);
    state.userImage = img;
    render();
    showToast('Photo loaded successfully! 🎉');
  } catch (err) {
    console.error('File load error:', err);
    showToast('Failed to load image. Please try another file.');
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
    : 'builder';
  const filename = `${sanitized}_hhgoa2026.png`;

  if (mainCanvas.toBlob) {
    mainCanvas.toBlob((blob) => {
      if (!blob) {
        fallbackDataUrlDownload(filename);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', filename);
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
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

  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  }, 300);

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
        format: 'formatB',
        name: state.name,
        builderTitle: state.builderTitle
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.shareUrl) {
        shareUrl = data.shareUrl;
      }
    }
  } catch (err) {
    console.warn('Backend share link endpoint unavailable, falling back to direct tweet intent:', err);
  }

  // Pre-filled tweet caption with required hashtag #FrameInGoa
  const caption = encodeURIComponent(
    'Excited for HH Goa 2026! 🚀 Created my official Builder Badge with #FrameInGoa.'
  );

  const tweetIntentUrl = `https://x.com/intent/tweet?text=${caption}&url=${encodeURIComponent(shareUrl)}`;

  // Mobile Web Share API check if supported
  if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      mainCanvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'HH_Goa_2026_Badge.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'HH Goa 2026 Badge',
              text: 'Created my HH Goa 2026 badge! #FrameInGoa',
              files: [file]
            });
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

  // Open X tweet intent window
  window.open(tweetIntentUrl, '_blank');
  showToast('Opened X post draft with #FrameInGoa! 🐦');
}

function showToast(msg: string) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'flex';
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
