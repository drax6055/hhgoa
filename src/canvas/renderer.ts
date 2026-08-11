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

// Pre-trigger loading of all assets
loadBadgeTemplate().catch(() => {});
loadGoaSticker().catch(() => {});
loadPfpFrame().catch(() => {});

// ─── Main entry point ─────────────────────────────────────────────────────────

export function drawGraphic(canvas: HTMLCanvasElement, options: RenderOptions) {
  if (options.format === 'formatA') {
    // Format A: square 1080×1080 PFP frame
    const size = 1080;
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    renderFormatA(ctx, size, size, options, canvas);
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
// Canvas: 1080 × 1080 square
// The pfp_frame.png sits as a full overlay on top. The user photo is drawn
// clipped into a circle that fits inside the circular hole in the frame.
//
// Measurements from plan_a.png (4:5 source scaled to 1080×1080 square):
//   Circle centre: ~50% X, ~43% Y  → (540, 464)
//   Circle radius: ~34% of width    → 370 px

function renderFormatA(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: RenderOptions,
  canvas?: HTMLCanvasElement
) {
  // ── 1. Dark green background (matches frame colour) ──
  ctx.fillStyle = '#0b5c35';
  ctx.fillRect(0, 0, W, H);

  // ── 2. Clipped user photo inside the circular hole ──
  // The frame image is 4:5 tall so the circle hole centre (from the PNG)
  // at ~50% x and ~42% y in the original — when we scale to square we keep
  // the same pixel ratios relative to the 1080-wide side.
  // Frame source: 950×1190px → scaled to fill 1080 wide → height = 1080*(1190/950)=1353
  // So the frame PNG is drawn starting at y = (1080-1353)/2 = -136 to centre it.

  const frameSrcW = pfpFrameImage ? pfpFrameImage.naturalWidth : 950;
  const frameSrcH = pfpFrameImage ? pfpFrameImage.naturalHeight : 1190;
  const frameAspect = frameSrcW / frameSrcH;

  let frameDrawW: number, frameDrawH: number, frameOffsetX: number, frameOffsetY: number;

  // Fit the frame to cover the 1080×1080 square (cover strategy)
  if (W / H > frameAspect) {
    // canvas is wider → fit by width
    frameDrawW = W;
    frameDrawH = W / frameAspect;
  } else {
    // canvas is taller → fit by height
    frameDrawH = H;
    frameDrawW = H * frameAspect;
  }
  frameOffsetX = (W - frameDrawW) / 2;
  frameOffsetY = (H - frameDrawH) / 2;

  // The circular hole in plan_a.png is roughly:
  //   centre: 50% x, 44.5% y (of the source image dimensions)
  //   radius: 37.5% of source width
  const holeCentreXRatio = 0.500;
  const holeCentreYRatio = 0.445;
  const holeRadiusRatio  = 0.375;

  const circleCX = frameOffsetX + frameDrawW * holeCentreXRatio;
  const circleCY = frameOffsetY + frameDrawH * holeCentreYRatio;
  const circleR  = frameDrawW * holeRadiusRatio;

  if (opts.userImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(circleCX, circleCY, circleR, 0, Math.PI * 2);
    ctx.clip();

    const img = opts.userImage;
    const imgAspect = img.naturalWidth / img.naturalHeight;

    // Cover the circle bounding box, then apply user adjustments
    const baseSize = circleR * 2 * opts.scale;
    let drawW = baseSize;
    let drawH = baseSize / imgAspect;
    if (drawH < baseSize) {
      drawH = baseSize;
      drawW = baseSize * imgAspect;
    }

    ctx.translate(
      circleCX + opts.offsetX,
      circleCY + opts.offsetY
    );
    ctx.rotate((opts.rotation * Math.PI) / 180);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    // Placeholder circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(circleCX, circleCY, circleR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(254,225,1,0.5)';
    ctx.lineWidth = 6;
    ctx.setLineDash([18, 10]);
    ctx.stroke();

    // Placeholder icon + text
    ctx.fillStyle = 'rgba(254,225,1,0.7)';
    ctx.font = `bold ${Math.round(circleR * 0.22)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷 Upload Photo', circleCX, circleCY);
    ctx.restore();
  }

  // ── 3. Draw the PFP frame PNG on top (full overlay) ──
  if (pfpFrameImage?.complete && pfpFrameImage.naturalWidth > 0) {
    ctx.drawImage(pfpFrameImage, frameOffsetX, frameOffsetY, frameDrawW, frameDrawH);
  } else {
    loadPfpFrame().then(() => {
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
