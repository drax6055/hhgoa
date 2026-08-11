export interface RenderOptions {
  format?: string;       // 'formatA' | 'formatB'
  themeId?: string;
  userImage: HTMLImageElement | null;
  scale: number;         // 0.5 to 2.5
  offsetX: number;       // -300 to 300
  offsetY: number;       // -300 to 300
  rotation: number;      // -180 to 180
  name: string;
  stackRole: string;
  builderTitle?: string;
}

// ─── Asset cache ──────────────────────────────────────────────────────────────

let badgeTemplateImage: HTMLImageElement | null = null;
let badgeTemplatePromise: Promise<HTMLImageElement> | null = null;

let goaStickerImage: HTMLImageElement | null = null;
let goaStickerPromise: Promise<HTMLImageElement> | null = null;

let pfpFrameImage: HTMLImageElement | null = null;
let pfpFramePromise: Promise<HTMLImageElement> | null = null;

let pfpStickerImage: HTMLImageElement | null = null;
let pfpStickerPromise: Promise<HTMLImageElement> | null = null;

// ─── Loaders ──────────────────────────────────────────────────────────────────

export function loadBadgeTemplate(): Promise<HTMLImageElement> {
  if (badgeTemplateImage?.complete) return Promise.resolve(badgeTemplateImage);
  if (badgeTemplatePromise) return badgeTemplatePromise;
  badgeTemplatePromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { badgeTemplateImage = img; resolve(img); };
    img.onerror = (err) => { console.error('Failed to load /badge_template.png', err); reject(err); };
    img.src = '/badge_template.png';
  });
  return badgeTemplatePromise;
}

export function loadGoaSticker(): Promise<HTMLImageElement> {
  if (goaStickerImage?.complete) return Promise.resolve(goaStickerImage);
  if (goaStickerPromise) return goaStickerPromise;
  goaStickerPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { goaStickerImage = img; resolve(img); };
    img.onerror = (err) => { console.error('Failed to load /goa_sticker.png', err); reject(err); };
    img.src = '/goa_sticker.png';
  });
  return goaStickerPromise;
}

export function loadPfpFrame(): Promise<HTMLImageElement> {
  if (pfpFrameImage?.complete) return Promise.resolve(pfpFrameImage);
  if (pfpFramePromise) return pfpFramePromise;
  pfpFramePromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { pfpFrameImage = img; resolve(img); };
    img.onerror = (err) => { console.error('Failed to load /pfp_frame.png', err); reject(err); };
    img.src = '/pfp_frame.png';
  });
  return pfpFramePromise;
}

export function loadPfpSticker(): Promise<HTMLImageElement> {
  if (pfpStickerImage?.complete) return Promise.resolve(pfpStickerImage);
  if (pfpStickerPromise) return pfpStickerPromise;
  pfpStickerPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { pfpStickerImage = img; resolve(img); };
    img.onerror = (err) => { console.error('Failed to load /pfp_beage.png', err); reject(err); };
    img.src = '/pfp_beage.png';
  });
  return pfpStickerPromise;
}

// Pre-trigger loading of all assets
loadBadgeTemplate().catch(() => {});
loadGoaSticker().catch(() => {});
loadPfpFrame().catch(() => {});
loadPfpSticker().catch(() => {});

// ─── Main entry point ─────────────────────────────────────────────────────────

export function drawGraphic(canvas: HTMLCanvasElement, options: RenderOptions) {
  if (options.format === 'formatA') {
    // Format A: 1080×1350 portrait PFP frame (matches frame PNG 4:5 ratio)
    const W = 1080;
    const H = 1350;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    renderFormatA(ctx, W, H, options, canvas);
  } else {
    // Format B: tall badge 1587×2245
    const width = 1587;
    const height = 2245;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    renderFormatB(ctx, width, height, options, canvas);
  }
}

// ─── FORMAT A: PFP Frame/Overlay ──────────────────────────────────────────────
// Canvas: 1080 × 1350 (4:5 ratio)
// Offscreen canvas cache for hole-punched frame overlay
let punchedFrameCanvas: HTMLCanvasElement | null = null;

function getPunchedFrame(img: HTMLImageElement): HTMLCanvasElement {
  if (punchedFrameCanvas && punchedFrameCanvas.width === img.naturalWidth && punchedFrameCanvas.height === img.naturalHeight) {
    return punchedFrameCanvas;
  }
  if (!img.complete || img.naturalWidth === 0) return document.createElement('canvas');

  const off = document.createElement('canvas');
  const imgW = img.naturalWidth || 1080;
  const imgH = img.naturalHeight || 1350;
  off.width = imgW;
  off.height = imgH;
  const ctx = off.getContext('2d');
  if (!ctx) return off;

  // 1. Draw original frame image
  ctx.drawImage(img, 0, 0);

  // 2. Punch out the full white circle cutout at center (540, 670) with radius 365
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(540, 670, 365, 0, Math.PI * 2);
  ctx.fill();

  punchedFrameCanvas = off;
  return off;
}

// ─── FORMAT A: PFP Frame/Overlay ──────────────────────────────────────────────
// Canvas: 1080 × 1350 (4:5 ratio)
// DRAW ORDER:
//   1. Solid green background fill
//   2. User photo (clipped to circle hole) or white placeholder circle
//   3. Frame overlay with punched transparent hole drawn ON TOP
//      (Yellow title, dashed ring & pink Goa sticker sit cleanly on top of photo)

function renderFormatA(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: RenderOptions,
  canvas?: HTMLCanvasElement
) {
  // ── Step 1. Solid green background ──
  ctx.fillStyle = '#0b5c35';
  ctx.fillRect(0, 0, W, H);

  // Exact circle parameters for 1080 × 1350 frame overlay
  const circleCX = 540;
  const circleCY = 670;
  const circleR  = 365;

  // ── Step 2. Draw user photo UNDER the frame overlay ──
  if (opts.userImage) {
    ctx.save();
    // Fill white circle background under photo for transparent PNGs or scaled photos
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(circleCX, circleCY, circleR, 0, Math.PI * 2);
    ctx.fill();

    // Clip slightly larger (+2px) than hole to ensure zero gap under frame border
    ctx.beginPath();
    ctx.arc(circleCX, circleCY, circleR + 2, 0, Math.PI * 2);
    ctx.clip();

    const img = opts.userImage;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const diameter = circleR * 2;

    let drawW: number, drawH: number;
    if (imgAspect >= 1) {
      drawH = diameter * opts.scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = diameter * opts.scale;
      drawH = drawW / imgAspect;
    }
    if (drawW < diameter * opts.scale) { drawW = diameter * opts.scale; drawH = drawW / imgAspect; }
    if (drawH < diameter * opts.scale) { drawH = diameter * opts.scale; drawW = drawH * imgAspect; }

    ctx.translate(circleCX + opts.offsetX, circleCY + opts.offsetY);
    ctx.rotate((opts.rotation * Math.PI) / 180);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    // White placeholder circle when no image loaded yet
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(circleCX, circleCY, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Step 3. Draw frame overlay ON TOP (punched hole lets photo show through) ──
  if (pfpFrameImage?.complete && pfpFrameImage.naturalWidth > 0) {
    const frameOverlay = getPunchedFrame(pfpFrameImage);
    ctx.drawImage(frameOverlay, 0, 0, W, H);
  } else {
    loadPfpFrame().then(() => {
      if (canvas) drawGraphic(canvas, opts);
    });
  }

  // ── Step 4. Draw pink Goa sticker (pfp_beage.png) ON TOP ──
  if (pfpStickerImage?.complete && pfpStickerImage.naturalWidth > 0) {
    ctx.drawImage(pfpStickerImage, 662, 810, 209, 203);
  } else {
    loadPfpSticker().then(() => {
      if (canvas) drawGraphic(canvas, opts);
    });
  }
}


// ─── FORMAT B: Builder ID Card ────────────────────────────────────────────────
// Canvas: 1587 × 2245

function renderFormatB(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: RenderOptions,
  canvas?: HTMLCanvasElement
) {
  // Background template
  if (badgeTemplateImage?.complete && badgeTemplateImage.naturalWidth > 0) {
    ctx.drawImage(badgeTemplateImage, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#063b27';
    ctx.fillRect(0, 0, width, height);
    loadBadgeTemplate().then(() => {
      if (canvas) drawGraphic(canvas, opts);
    });
  }

  // 1. Photo slot — rounded rect (521,596) size 499×580 r=44
  const photoX = 521, photoY = 596, photoW = 499, photoH = 580, photoRadius = 44;

  if (opts.userImage) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.clip();

    ctx.translate(photoX + photoW / 2 + opts.offsetX * 1.5, photoY + photoH / 2 + opts.offsetY * 1.5);
    ctx.rotate((opts.rotation * Math.PI) / 180);

    const img = opts.userImage;
    const aspect = img.naturalWidth / img.naturalHeight;
    let drawW = photoW * opts.scale;
    let drawH = drawW / aspect;
    if (drawH < photoH * opts.scale) { drawH = photoH * opts.scale; drawW = drawH * aspect; }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '600 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📷 Click / Drag Photo', photoX + photoW / 2, photoY + photoH / 2 - 40);
    ctx.restore();
  }

  // 2. गोवा sticker
  if (goaStickerImage?.complete && goaStickerImage.naturalWidth > 0) {
    ctx.drawImage(goaStickerImage, 608, 972, 300, 280);
  } else {
    loadGoaSticker().then(() => { if (canvas) drawGraphic(canvas, opts); });
  }

  // 3. Name
  if (opts.name?.trim()) {
    ctx.save();
    const nameText = opts.name.trim().toUpperCase();
    let fontSize = 52;
    ctx.font = `900 ${fontSize}px Inter, Outfit, sans-serif`;
    while (ctx.measureText(nameText).width > 540 && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `900 ${fontSize}px Inter, Outfit, sans-serif`;
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, 799, 1393);
    ctx.restore();
  }

  // 4. Role / Stack
  const roleVal = opts.stackRole || opts.builderTitle;
  if (roleVal?.trim()) {
    ctx.save();
    const roleText = roleVal.trim().toUpperCase();
    let roleFontSize = 42;
    ctx.font = `900 ${roleFontSize}px Inter, Outfit, sans-serif`;
    while (ctx.measureText(roleText).width > 720 && roleFontSize > 22) {
      roleFontSize -= 2;
      ctx.font = `900 ${roleFontSize}px Inter, Outfit, sans-serif`;
    }
    ctx.fillStyle = '#F9B60D';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(roleText, 109, 2085);
    ctx.restore();
  }
}
