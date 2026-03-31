import GSAP from "gsap";

export default class DNA {
    constructor() {
        this.TOTAL_FRAMES = 192;
        this.FRAME_PATH = "/dna_frames/frame_";
        this.FRAME_SUFFIX = "_delay-0.041s.png";

        this.frames = new Array(this.TOTAL_FRAMES);
        this.loadedCount = 0;
        this.currentFrame = 0;
        this.canvas = document.querySelector("#dna-canvas");

        if (!this.canvas) return;

        this.ctx = this.canvas.getContext("2d");
        this.setCanvasSize();
        this.preloadFrames();
        this.setupScrollTrigger();
        this.setupResize();
    }

    pad(num) {
        return String(num).padStart(3, "0");
    }

    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    preloadFrames() {
        for (let i = 0; i < this.TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = `${this.FRAME_PATH}${this.pad(i)}${this.FRAME_SUFFIX}`;
            img.onload = () => {
                this.loadedCount++;
                if (i === 0) this.drawFrame(0);
            };
            this.frames[i] = img;
        }
    }

    drawFrame(index) {
        const img = this.frames[index];
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const cw = this.canvas.width;
        const ch = this.canvas.height;

        // Crop bottom 5% to hide Veo watermark
        const sw = img.naturalWidth;
        const sh = img.naturalHeight;
        const srcH = Math.round(sh * 0.95);

        // "cover" fit
        const srcAspect = sw / srcH;
        const canvasAspect = cw / ch;
        let drawW, drawH, offsetX, offsetY;

        if (srcAspect > canvasAspect) {
            drawH = ch;
            drawW = ch * srcAspect;
            offsetX = (cw - drawW) / 2;
            offsetY = 0;
        } else {
            drawW = cw;
            drawH = cw / srcAspect;
            offsetX = 0;
            offsetY = (ch - drawH) / 2;
        }

        this.ctx.clearRect(0, 0, cw, ch);
        this.ctx.drawImage(img, 0, 0, sw, srcH, offsetX, offsetY, drawW, drawH);

        // Cinematic vignette: fade top and bottom edges to black
        const vignetteSize = Math.round(ch * 0.12);

        // Top vignette
        const topGrad = this.ctx.createLinearGradient(0, 0, 0, vignetteSize);
        topGrad.addColorStop(0, "rgba(0, 0, 0, 0.85)");
        topGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
        topGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        this.ctx.fillStyle = topGrad;
        this.ctx.fillRect(0, 0, cw, vignetteSize);

        // Bottom vignette
        const botGrad = this.ctx.createLinearGradient(0, ch - vignetteSize, 0, ch);
        botGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
        botGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
        botGrad.addColorStop(1, "rgba(0, 0, 0, 0.85)");
        this.ctx.fillStyle = botGrad;
        this.ctx.fillRect(0, ch - vignetteSize, cw, vignetteSize);
    }

    setupScrollTrigger() {
        const section = document.querySelector(".dna-transition");
        const sticky = document.querySelector(".dna-sticky");
        if (!section || !sticky) return;

        const frameObj = { frame: 0 };

        // Use GSAP pin — this works correctly with ASScroll's transform-based scrolling
        GSAP.to(frameObj, {
            frame: this.TOTAL_FRAMES - 1,
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "+=200%",
                scrub: 0.8,
                pin: sticky,
                pinSpacing: true,
                anticipatePin: 1,
                onRefresh: (self) => {
                    // Force the GSAP-generated pin-spacer to have a black background
                    if (self.pin && self.pin.parentElement) {
                        const spacer = self.pin.parentElement;
                        spacer.style.backgroundColor = "#000";
                    }
                    // Also force the section itself
                    section.style.backgroundColor = "#000";
                },
            },
            onUpdate: () => {
                const idx = Math.round(frameObj.frame);
                if (idx !== this.currentFrame) {
                    this.currentFrame = idx;
                    this.drawFrame(idx);
                }
            },
        });

        // Fallback: Find and style any pin-spacer elements after a short delay
        requestAnimationFrame(() => {
            const spacers = document.querySelectorAll(".pin-spacer");
            spacers.forEach((spacer) => {
                if (section.contains(spacer) || spacer.contains(sticky)) {
                    spacer.style.backgroundColor = "#000";
                }
            });
            // Also check if sticky's parent is the pin-spacer
            if (sticky.parentElement && sticky.parentElement !== section) {
                sticky.parentElement.style.backgroundColor = "#000";
            }
        });
    }

    setupResize() {
        window.addEventListener("resize", () => {
            this.setCanvasSize();
            this.drawFrame(this.currentFrame);
        });
    }
}
