"use client";

import { useCallback, useRef } from "react";

export interface FanCardData {
    displayName: string;
    role: string;
    memberId: string;
    memberTitle: string;
    avatarUrl: string | null;
    dob: string | null;
    customNote: string | null;
    favoritePlayer: {
        name: string;
        roleKey: string;
        image: string;
        signatureImg?: string;
    } | null;
    aspectRatio?: "16:9" | "9:16";
    theme?: "member" | "bank";
    customQrUrl?: string | null;
    bankCardNumber?: string;
    cvv?: string;
}

const R = 24;

const GOLD_COLOR = "#D4AF37";
const GOLD_LIGHT = "#F5E6A3";

function loadImg(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("load fail " + src));
        img.src = src;
    });
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function circleImg(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number, borderColor: string, borderWidth = 3) {
    // Outer ring
    ctx.beginPath(); ctx.arc(cx, cy, r + borderWidth, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.stroke();
    // Image
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    const size = r * 2;
    // Fit the image nicely
    const scale = Math.max(size / img.width, size / img.height);
    const x = cx - (img.width * scale) / 2;
    const y = cy - (img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    ctx.restore();
}

export function useFanCard() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const renderCard = useCallback(async (data: FanCardData, scaleMultiplier: number = 1): Promise<HTMLCanvasElement> => {
        const isPortrait = data.aspectRatio === "9:16";
        const CW = isPortrait ? 540 : 800;
        const CH = isPortrait ? 960 : 450;

        const canvas = canvasRef.current || document.createElement("canvas");
        canvasRef.current = canvas;
        canvas.width = CW * scaleMultiplier;
        canvas.height = CH * scaleMultiplier;
        const ctx = canvas.getContext("2d")!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply visual scale
        ctx.save();
        ctx.scale(scaleMultiplier, scaleMultiplier);

        // Path for rounded corners
        ctx.save();
        rr(ctx, 0, 0, CW, CH, R);
        ctx.clip();

        try {
            // 1. Draw Background Image
            const bgPath = isPortrait ? "/images/fancard-916.png" : "/images/fancard-bg.jpg";
            const bgImg = await loadImg(bgPath);
            // object-fit: cover logic
            const imgRatio = bgImg.width / bgImg.height;
            const canvasRatio = CW / CH;
            let drawWidth, drawHeight, drawX, drawY;
            if (imgRatio > canvasRatio) {
                drawHeight = CH;
                drawWidth = bgImg.width * (CH / bgImg.height);
                drawX = (CW - drawWidth) / 2;
                drawY = 0;
            } else {
                drawWidth = CW;
                drawHeight = bgImg.height * (CW / bgImg.width);
                drawX = 0;
                drawY = (CH - drawHeight) / 2;
            }
            ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
        } catch (e) {
            console.error(e);
            // Fallback dark gradient if image fails to load
            const bg = ctx.createLinearGradient(0, 0, CW, CH);
            bg.addColorStop(0, "#0a0a0a");
            bg.addColorStop(1, "#1a1a1a");
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, CW, CH);
        }

        // Add a slight dark overlay to ensure text readability over the image
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, CW, CH);

        // Remove the default background logo as requested: 
        // "bỏ chữ gen.g luôn, có sẵn trong ảnh của t r"

        // 1.5 Draw ID Card Notch (rãnh trên ID card)
        if (data.theme !== "bank") {
            ctx.fillStyle = "#000000"; // Assuming a dark/transparent background behind the card
            const notchWidth = 80;
            const notchHeight = 15;
            const notchX = (CW - notchWidth) / 2;

            ctx.save();
            ctx.beginPath();
            // A pill-shaped notch at the top center
            ctx.roundRect(notchX, -10, notchWidth, notchHeight + 10, 10);
            ctx.clip();
            ctx.clearRect(0, 0, CW, CH);
            ctx.restore();

            // Draw the notch border
            ctx.beginPath();
            ctx.roundRect(notchX, -10, notchWidth, notchHeight + 10, 10);
            ctx.strokeStyle = "rgba(212,175,55,0.4)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }


        // 2. Organization name and Header
        ctx.fillStyle = GOLD_COLOR;
        ctx.font = "bold 28px 'Oswald', sans-serif";
        ctx.textAlign = "center";
        ctx.letterSpacing = "4px";
        ctx.fillText(data.theme === "bank" ? "TIGER NATION BANK" : "TIGER NATION ID", CW / 2, 115);
        ctx.textAlign = "left"; // reset
        ctx.letterSpacing = "0px";

        if (data.theme !== "bank") {
            // "MEMBER CARD" label top right
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "bold 14px 'Inter', sans-serif";
            ctx.textAlign = "right";
            ctx.letterSpacing = "2px";
            ctx.fillText("OFFICIAL MEMBER", CW - 30, 60);

            // Custom Member ID
            ctx.fillStyle = GOLD_LIGHT;
            ctx.font = "bold 18px 'Inter', monospace";
            ctx.textAlign = "right";
            ctx.fillText(data.memberId, CW - 30, 85);
            ctx.letterSpacing = "0px"; // reset
            ctx.textAlign = "left"; // reset
        }

        // Separator line (Thanh line thẳng xuống một tí)
        const sepY = 130;
        const sep = ctx.createLinearGradient(40, sepY, CW - 40, sepY);
        sep.addColorStop(0, "rgba(212,175,55,0.8)");
        sep.addColorStop(1, "rgba(212,175,55,0.0)");
        ctx.strokeStyle = sep; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(40, sepY); ctx.lineTo(CW - 40, sepY); ctx.stroke();


        if (isPortrait) {
            // PORTRAIT LAYOUT
            // 3. User Avatar
            const avW = 200, avH = 260;
            const avX = (CW - avW) / 2;
            const avY = 160;
            ctx.save();
            rr(ctx, avX, avY, avW, avH, 12);
            ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = GOLD_COLOR; ctx.stroke();
            if (data.avatarUrl) {
                try {
                    const avatarImg = await loadImg(data.avatarUrl);
                    ctx.clip();
                    const scale = Math.max(avW / avatarImg.width, avH / avatarImg.height);
                    const drawW = avatarImg.width * scale;
                    const drawH = avatarImg.height * scale;
                    ctx.drawImage(avatarImg, avX + (avW - drawW) / 2, avY + (avH - drawH) / 2, drawW, drawH);
                } catch { }
            } else {
                ctx.fillStyle = "rgba(255,255,255,0.2)";
                ctx.font = "14px 'Inter', sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("NO PHOTO", avX + avW / 2, avY + avH / 2);
            }
            ctx.restore();

            // 4. User Details
            const detailsY = 480;
            ctx.textAlign = "center";
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 42px 'Oswald', sans-serif";
            ctx.fillText(data.displayName.toUpperCase(), CW / 2, detailsY);

            ctx.fillStyle = GOLD_COLOR;
            ctx.font = "bold 16px 'Inter', sans-serif";
            ctx.letterSpacing = "4px";
            ctx.fillText(data.memberTitle.toUpperCase(), CW / 2, detailsY + 35);
            ctx.letterSpacing = "0px";

            let textOffsetY = detailsY + 80;
            if (data.dob) {
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.font = "12px 'Inter', sans-serif";
                ctx.fillText("DOB", CW / 2, textOffsetY);
                ctx.fillStyle = "#FFFFFF";
                ctx.font = "bold 14px 'Inter', monospace";
                ctx.fillText(data.dob, CW / 2, textOffsetY + 20);
                textOffsetY += 45;
            }

            if (data.customNote) {
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.font = "italic 13px 'Inter', sans-serif";
                ctx.fillText(`"${data.customNote}"`, CW / 2, textOffsetY);
            }

            // 5. Favorite Player Section
            if (data.favoritePlayer) {
                const rx = (CW - 320) / 2;
                const ry = 620;

                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.strokeStyle = "rgba(212,175,55,0.3)";
                ctx.lineWidth = 1;
                rr(ctx, rx, ry, 320, 110, 12);
                ctx.fill(); ctx.stroke();

                ctx.textAlign = "left";
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.font = "600 11px 'Inter', sans-serif";
                ctx.fillText("FAVORITE PLAYER", rx + 25, ry + 25);

                ctx.fillStyle = GOLD_LIGHT;
                ctx.font = "bold 24px 'Oswald', sans-serif";
                ctx.fillText(data.favoritePlayer.name.toUpperCase(), rx + 25, ry + 55);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "13px 'Inter', sans-serif";
                ctx.fillText(data.favoritePlayer.roleKey, rx + 25, ry + 75);

                try {
                    const imgPath = data.favoritePlayer.image.startsWith('http')
                        ? `/_next/image?url=${encodeURIComponent(data.favoritePlayer.image)}&w=256&q=75`
                        : data.favoritePlayer.image;
                    const pimg = await loadImg(imgPath);
                    circleImg(ctx, pimg, rx + 260, ry + 55, 40, GOLD_COLOR, 2);
                } catch (e) {
                    console.error("Player image load error", e);
                }

                if (data.favoritePlayer.signatureImg) {
                    try {
                        ctx.textAlign = "center";
                        ctx.fillStyle = "rgba(255,255,255,0.4)";
                        ctx.font = "italic 11px 'Inter', sans-serif";
                        ctx.fillText("Verified by", CW / 2, ry + 150);

                        const signImgPath = data.favoritePlayer.signatureImg.startsWith('http')
                            ? `/_next/image?url=${encodeURIComponent(data.favoritePlayer.signatureImg)}&w=256&q=75`
                            : data.favoritePlayer.signatureImg;
                        const signImg = await loadImg(signImgPath);
                        ctx.drawImage(signImg, (CW - 200) / 2, ry + 160, 200, 90);
                    } catch (e) {
                        console.error("Signature image load error", e);
                    }
                }
            }

            // Watermark Text - Bottom center
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.font = "11px 'Inter', sans-serif";
            ctx.letterSpacing = "1px";
            ctx.textAlign = "center";
            ctx.fillText("Generate yours at fancard.gengfandom.fun", CW / 2, CH - 30);
            ctx.restore();

            // Custom QR Code (Portrait Front)
            if (data.customQrUrl) {
                try {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.customQrUrl)}&color=000000&bgcolor=ffffff&qzone=1`;
                    const qrImg = await loadImg(qrUrl);
                    ctx.drawImage(qrImg, CW - 90, 40, 50, 50);
                } catch { }
            }

        } else {
            // LANDSCAPE LAYOUT
            if (data.theme === "bank") {
                // ================= VIP BANK CARD FRONT (16:9) =================
                // 1. EMV Chip
                const cx = 50, cy = 160, cw = 56, ch = 44;
                ctx.save();
                ctx.fillStyle = GOLD_COLOR;
                rr(ctx, cx, cy, cw, ch, 8);
                ctx.fill();

                ctx.strokeStyle = "rgba(0,0,0,0.5)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx + 17, cy); ctx.lineTo(cx + 17, cy + ch);
                ctx.moveTo(cx + cw - 17, cy); ctx.lineTo(cx + cw - 17, cy + ch);
                ctx.moveTo(cx, cy + 14); ctx.lineTo(cx + cw, cy + 14);
                ctx.moveTo(cx, cy + 30); ctx.lineTo(cx + cw, cy + 30);
                ctx.stroke();

                rr(ctx, cx + 13, cy + 10, cw - 26, ch - 20, 3);
                ctx.stroke();
                ctx.restore();

                // 2. Contactless Icon
                ctx.save();
                ctx.strokeStyle = "rgba(255,255,255,0.8)";
                ctx.lineWidth = 2.5;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.arc(cx + 90, cy + 22, 10, -Math.PI / 4, Math.PI / 4);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + 90, cy + 22, 16, -Math.PI / 4, Math.PI / 4);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + 90, cy + 22, 22, -Math.PI / 4, Math.PI / 4);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + 90, cy + 22, 28, -Math.PI / 4, Math.PI / 4);
                ctx.stroke();
                ctx.restore();

                // 3. Card Number (16 Digits pseudo-random based on mId, or generic)
                let cardNum = data.bankCardNumber || "";
                if (!cardNum || cardNum.trim() === "") {
                    const baseStr = (data.memberId || "0000000000").replace(/[^a-zA-Z0-9]/g, '').padEnd(12, '0').toUpperCase();
                    cardNum = `5241 ${baseStr.substring(0, 4)} ${baseStr.substring(4, 8)} ${baseStr.substring(8, 12)}`;
                } else {
                    // Try to format it visually nice if it's 16 raw digits
                    if (cardNum.length === 16 && !cardNum.includes(" ")) {
                        cardNum = cardNum.replace(/(.{4})/g, '$1 ').trim();
                    }
                }

                ctx.fillStyle = "#FFFFFF";
                // Glow effect for embossed look
                ctx.shadowColor = "rgba(0,0,0,0.8)";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 2;
                ctx.font = "bold 32px 'Courier New', monospace";
                ctx.textAlign = "left";
                ctx.fillText(cardNum, 50, 260);
                ctx.shadowColor = "transparent";

                // 4. Expiration Date
                ctx.fillStyle = "rgba(255,255,255,0.7)";
                ctx.font = "10px 'Inter', sans-serif";
                ctx.fillText("VALID THRU", 50, 300);
                ctx.fillStyle = "#FFFFFF";
                ctx.font = "bold 16px 'Courier New', monospace";
                // Fake a future date simply
                ctx.fillText("12/30", 120, 300);

                // 5. Cardholder Name
                ctx.fillStyle = "#FFFFFF";
                ctx.font = "bold 24px 'Oswald', sans-serif";
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetY = 1;
                ctx.fillText(data.displayName.toUpperCase(), 50, 350);

                // Member Title / Custom Note below
                ctx.font = "14px 'Inter', sans-serif";
                ctx.fillStyle = GOLD_COLOR;
                ctx.shadowColor = "transparent";
                ctx.fillText(data.memberTitle.toUpperCase(), 50, 380);

            } else {
                // ================= MEMBER CARD FRONT (16:9) =================
                // 3. User Avatar (ID Card Photo Style)
                const avX = 40, avY = 140, avW = 160, avH = 220;
                ctx.save();
                rr(ctx, avX, avY, avW, avH, 12);
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = GOLD_COLOR;
                ctx.stroke();

                if (data.avatarUrl) {
                    try {
                        const avatarImg = await loadImg(data.avatarUrl);
                        ctx.clip(); // Clip to rounded rectangle

                        // Calculate Aspect Fill
                        const scale = Math.max(avW / avatarImg.width, avH / avatarImg.height);
                        const drawW = avatarImg.width * scale;
                        const drawH = avatarImg.height * scale;
                        const drawX = avX + (avW - drawW) / 2;
                        const drawY = avY + (avH - drawH) / 2;

                        ctx.drawImage(avatarImg, drawX, drawY, drawW, drawH);
                    } catch (e) {
                        console.error("Avatar load error", e);
                    }
                } else {
                    ctx.fillStyle = "rgba(255,255,255,0.2)";
                    ctx.font = "14px 'Inter', sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText("NO PHOTO", avX + avW / 2, avY + avH / 2);
                }
                ctx.restore();

                // 4. User Details
                const detailsX = 230;
                const detailsY = 180;

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "bold 42px 'Oswald', sans-serif";
                ctx.textAlign = "left";
                ctx.fillText(data.displayName.toUpperCase(), detailsX, detailsY);

                // Custom Title / Danh hiệu
                ctx.fillStyle = GOLD_COLOR;
                ctx.font = "bold 16px 'Inter', sans-serif";
                ctx.letterSpacing = "4px";
                ctx.fillText(data.memberTitle.toUpperCase(), 230, detailsY + 35);
                ctx.letterSpacing = "0px";

                // Optional DOB
                let textOffsetY = detailsY + 70;
                if (data.dob) {
                    ctx.fillStyle = "rgba(255,255,255,0.5)";
                    ctx.font = "12px 'Inter', sans-serif";
                    ctx.fillText("DOB", 230, textOffsetY);

                    ctx.fillStyle = "#FFFFFF";
                    ctx.font = "bold 14px 'Inter', monospace";
                    ctx.fillText(data.dob, 265, textOffsetY);
                    textOffsetY += 25;
                }

                // Optional Custom Note
                if (data.customNote) {
                    ctx.fillStyle = "rgba(255,255,255,0.8)";
                    ctx.font = "italic 13px 'Inter', sans-serif";
                    ctx.fillText(`"${data.customNote}"`, 230, textOffsetY);
                }
            }

            // 5. Favorite Player Section (Common to both Bank and Member themes in Landscape)
            if (data.favoritePlayer) {
                const rx = CW - 280;
                const ry = 140;

                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.strokeStyle = "rgba(212,175,55,0.3)";
                ctx.lineWidth = 1;
                rr(ctx, rx, ry, 240, 100, 12);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.font = "600 10px 'Inter', sans-serif";
                ctx.textAlign = "left";
                ctx.fillText("FAVORITE PLAYER", rx + 20, ry + 25);

                ctx.fillStyle = GOLD_LIGHT;
                ctx.font = "bold 22px 'Oswald', sans-serif";
                ctx.fillText(data.favoritePlayer.name.toUpperCase(), rx + 20, ry + 55);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "12px 'Inter', sans-serif";
                ctx.fillText(data.favoritePlayer.roleKey, rx + 20, ry + 75);

                try {
                    // Use Next.js Image Optimizer as a CORS proxy for external images
                    const imgPath = data.favoritePlayer.image.startsWith('http')
                        ? `/_next/image?url=${encodeURIComponent(data.favoritePlayer.image)}&w=256&q=75`
                        : data.favoritePlayer.image;
                    const pimg = await loadImg(imgPath);
                    circleImg(ctx, pimg, rx + 190, ry + 50, 35, GOLD_COLOR, 2);
                } catch (e) {
                    console.error("Player image load error", e);
                }

                // Draw Signature below the Favorite Player box
                if (data.favoritePlayer.signatureImg) {
                    try {
                        ctx.fillStyle = "rgba(255,255,255,0.4)";
                        ctx.font = "italic 11px 'Inter', sans-serif";
                        ctx.textAlign = "left";
                        ctx.fillText("Verified by", rx, ry + 125);

                        const signImgPath = data.favoritePlayer.signatureImg.startsWith('http')
                            ? `/_next/image?url=${encodeURIComponent(data.favoritePlayer.signatureImg)}&w=256&q=75`
                            : data.favoritePlayer.signatureImg;
                        const signImg = await loadImg(signImgPath);
                        // Draw image appropriately scaled (2x larger)
                        ctx.drawImage(signImg, rx, ry + 135, 180, 80);
                    } catch (e) {
                        console.error("Signature image load error", e);
                    }
                }
            }

            // Custom QR Code (Landscape Front)
            if (!isPortrait && data.customQrUrl) {
                try {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.customQrUrl)}&color=000000&bgcolor=ffffff&qzone=1`;
                    const qrImg = await loadImg(qrUrl);
                    // For Bank theme, bottom left is occupied by Name. Move QR to Top Left next to Title.
                    const qrY = data.theme === "bank" ? 40 : CH - 90;
                    ctx.drawImage(qrImg, 40, qrY, 60, 60);
                } catch { }
            }

            // Watermark Text - Top right corner
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.font = "10px 'Inter', sans-serif";
            ctx.letterSpacing = "1px";
            ctx.textAlign = "right";
            ctx.fillText("Generate yours at fancard.gengfandom.fun", CW - 40, 35);
            ctx.restore();
        }

        // 5. Bottom left custom element (Empty for now to let background shine)
        if (!isPortrait && data.customQrUrl) {
            try {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.customQrUrl)}&color=000000&bgcolor=ffffff&qzone=1`;
                const qrImg = await loadImg(qrUrl);
                ctx.drawImage(qrImg, 40, CH - 90, 60, 60);
            } catch { }
        }

        // Outer Frame border
        ctx.restore(); // Remove clip
        rr(ctx, 2, 2, CW - 4, CH - 4, R);
        ctx.strokeStyle = "rgba(212,175,55,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore(); // Remove scaling transform

        return canvas;
    }, []);

    const renderBackCard = useCallback(async (data: FanCardData, scaleMultiplier: number = 1): Promise<HTMLCanvasElement> => {
        const isPortrait = data.aspectRatio === "9:16";
        const CW = isPortrait ? 540 : 800;
        const CH = isPortrait ? 960 : 450;
        const R = 30;

        const canvas = document.createElement("canvas");
        canvas.width = CW * scaleMultiplier;
        canvas.height = CH * scaleMultiplier;
        const ctx = canvas.getContext("2d")!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply visual scale
        ctx.save();
        ctx.scale(scaleMultiplier, scaleMultiplier);

        // Path for rounded corners
        ctx.save();
        rr(ctx, 0, 0, CW, CH, R);
        ctx.clip();

        // Background
        const bgImgPath = isPortrait ? "/images/fancard-916.png" : "/images/fancard-bg.jpg";
        try {
            const bgImg = await loadImg(bgImgPath);
            const canvasRatio = CW / CH;
            const imgRatio = bgImg.width / bgImg.height;
            let drawW = CW, drawH = CH, drawX = 0, drawY = 0;
            if (canvasRatio > imgRatio) {
                drawH = CW / imgRatio; drawY = (CH - drawH) / 2;
            } else {
                drawW = CH * imgRatio; drawX = (CW - drawW) / 2;
            }
            ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        } catch {
            ctx.fillStyle = "#111"; ctx.fillRect(0, 0, CW, CH);
        }

        // Apply dark overlay
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, CW, CH);

        const isBankTheme = data.theme !== "member";

        if (isBankTheme || isPortrait) {
            // ================= BANK CARD OR PORTRAIT BACK =================
            // Magnetic Stripe
            const magY = isPortrait ? 80 : 50;
            const magH = isPortrait ? 80 : 60;
            ctx.fillStyle = "#050505"; // very dark
            ctx.fillRect(0, magY, CW, magH);

            // Add minimal texture to magstripe
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            for (let i = 0; i < magH; i += 4) {
                ctx.fillRect(0, magY + i, CW, 1);
            }

            // Signature Box
            const sigY = magY + magH + (isPortrait ? 40 : 30);
            const sigW = isPortrait ? 300 : 380;
            const sigH = isPortrait ? 50 : 45;
            const sigX = isPortrait ? (CW - sigW) / 2 : 40;

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillRect(sigX, sigY, sigW, sigH);

            // Holographic-like Pattern over signature box faint
            ctx.fillStyle = "rgba(212,175,55,0.1)";
            ctx.font = "italic 20px 'Oswald', sans-serif";
            ctx.textAlign = "left";
            for (let i = 0; i < 4; i++) {
                ctx.fillText("TIGER NATION", sigX + 10 + (i * 120), sigY + 30);
            }

            // Authorized Signature Hint
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.font = "italic 16px 'Inter', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Authorized Signature", sigX + sigW / 2, sigY + sigH / 2);

            // CVV Box
            const cvvX = sigX + sigW + 15;
            const cvvW = 60;
            if (!isPortrait) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.fillRect(cvvX, sigY, cvvW, sigH);
                ctx.fillStyle = "#000";
                ctx.font = "bold 18px monospace";
                ctx.textAlign = "center";
                ctx.fillText(data.cvv || "GEN", cvvX + cvvW / 2, sigY + sigH / 2);
            } else {
                // Portrait CVV place
                const pCvvX = sigX + sigW - cvvW;
                const pCvvY = sigY + sigH + 15;
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.fillRect(pCvvX, pCvvY, cvvW, Math.max(sigH - 10, 30));
                ctx.fillStyle = "#000";
                ctx.font = "bold 14px monospace";
                ctx.textAlign = "center";
                ctx.fillText(data.cvv || "GEN", pCvvX + cvvW / 2, pCvvY + Math.max(sigH - 10, 30) / 2);
            }

            // Terms text
            ctx.textBaseline = "alphabetic";
            const termsX = isPortrait ? CW / 2 : 40;
            let termsY = sigY + sigH + (isPortrait ? 100 : 50);

            ctx.fillStyle = GOLD_COLOR;
            ctx.textAlign = isPortrait ? "center" : "left";
            ctx.font = "bold 12px 'Oswald', sans-serif";
            ctx.letterSpacing = "2px";
            ctx.fillText("PROPERTY OF TIGER NATION", termsX, termsY);
            ctx.letterSpacing = "0px";
            termsY += 25;

            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "10px 'Inter', sans-serif";
            const lines = [
                "This card is a digital collectible for exclusively non-commercial fan use.",
                "Use of this card is governed by the Gen.G Fandom terms and conditions.",
                "Issued by Gen.G Fandom."
            ];
            lines.forEach(line => {
                ctx.fillText(line, termsX, termsY);
                termsY += 18;
            });

            // Hologram / Big Watermark
            ctx.fillStyle = "rgba(212,175,55,0.06)";
            ctx.font = `bold ${isPortrait ? '80px' : '100px'} 'Oswald', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (isPortrait) {
                ctx.save();
                ctx.translate(CW / 2, CH - 180);
                ctx.rotate(-Math.PI / 4);
                ctx.fillText("TIGER NATION", 0, 0);
                ctx.restore();
            } else {
                ctx.fillText("GEN.G ESPORTS", CW / 2, CH - 60);
            }

            // Back Side Generic QR Code
            try {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent("https://fancard.gengfandom.fun")}&color=000000&bgcolor=ffffff&qzone=1`;
                const qrImg = await loadImg(qrUrl);
                const qrSize = isPortrait ? 60 : 70;
                const qrX = isPortrait ? (CW - qrSize) / 2 : CW - qrSize - 40;
                const qrY = isPortrait ? CH - 130 : CH - qrSize - 40;
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            } catch { }

        } else {
            // ================= CLASSIC MEMBER CARD BACK =================
            // Centered elegant typography without magnetic strip

            // Large Watermark Center
            ctx.fillStyle = "rgba(212,175,55,0.05)";
            ctx.font = "bold 110px 'Oswald', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("GEN.G ESPORTS", CW / 2, CH / 2 + 20);

            // TIGER NATION Box Header
            ctx.fillStyle = GOLD_COLOR;
            ctx.textAlign = "center";
            ctx.font = "bold 16px 'Oswald', sans-serif";
            ctx.letterSpacing = "4px";
            ctx.fillText("PROPERTY OF TIGER NATION", CW / 2, 70);
            ctx.letterSpacing = "0px";

            // Separator
            ctx.strokeStyle = "rgba(212,175,55,0.3)";
            ctx.beginPath();
            ctx.moveTo(CW / 2 - 100, 95);
            ctx.lineTo(CW / 2 + 100, 95);
            ctx.stroke();

            // Terms text centered
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "12px 'Inter', sans-serif";
            ctx.textBaseline = "alphabetic";
            let termsY = 140;
            const lines = [
                "This card is an official digital collectible for exclusively non-commercial fan use.",
                "Possession of this card signifies your unwavering loyalty to Gen.G.",
                "Use of this card is governed by the Gen.G Fandom rules and community guidelines.",
                "Issued by Gen.G Fandom. Change the game."
            ];
            lines.forEach(line => {
                ctx.fillText(line, CW / 2, termsY);
                termsY += 24;
            });

            // Center QR Code
            try {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent("https://fancard.gengfandom.fun")}&color=000000&bgcolor=ffffff&qzone=1`;
                const qrImg = await loadImg(qrUrl);
                const qrSize = 90;
                ctx.drawImage(qrImg, CW / 2 - qrSize / 2, CH - 160, qrSize, qrSize);
            } catch { }
        }

        // Outer Frame border
        ctx.restore(); // Remove clip
        rr(ctx, 2, 2, CW - 4, CH - 4, R);
        ctx.strokeStyle = "rgba(212,175,55,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore(); // Remove scaling transform
        return canvas;
    }, []);

    const downloadCard = useCallback(async (data: FanCardData, scaleMultiplier: number = 1, isBack: boolean = false) => {
        const canvas = isBack ? await renderBackCard(data, scaleMultiplier) : await renderCard(data, scaleMultiplier);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `geng-fancard-${isBack ? 'back-' : ''}${data.displayName.replace(/\s+/g, "-").toLowerCase()}.png`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }, "image/png", 1.0);
    }, [renderCard, renderBackCard]);

    return { renderCard, renderBackCard, downloadCard };
}
