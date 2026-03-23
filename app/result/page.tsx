"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, ArrowLeft, RefreshCw, CreditCard } from "lucide-react";
import { useFanCard, type FanCardData } from "@/components/fancard/useFanCard";

export default function ResultPage() {
    const router = useRouter();
    const { renderCard, renderBackCard, downloadCard } = useFanCard();

    const [cardData, setCardData] = useState<FanCardData | null>(null);
    const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
    const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);
    const [viewSide, setViewSide] = useState<"front" | "back">("front");
    const [isGenerating, setIsGenerating] = useState(false);
    const [quality, setQuality] = useState<string>("2"); // Scale multiplier

    useEffect(() => {
        const stored = sessionStorage.getItem("geng_fancard_data");
        if (!stored) {
            router.push("/");
            return;
        }
        try {
            const parsed = JSON.parse(stored) as FanCardData;
            setCardData(parsed);

            // Generate low-res previews instantly for the UI
            const isPortrait = parsed.aspectRatio === "9:16";
            renderCard(parsed, 1).then((canvas) => setFrontPreviewUrl(canvas.toDataURL("image/jpeg", 0.9)));
            if (!isPortrait) {
                renderBackCard(parsed, 1).then((canvas) => setBackPreviewUrl(canvas.toDataURL("image/jpeg", 0.9)));
            } else {
                setBackPreviewUrl("portrait-none");
            }
        } catch (e) {
            console.error("Failed to parse card data", e);
            router.push("/");
        }
    }, [router, renderCard, renderBackCard]);

    const handleDownload = async (isBack: boolean = false) => {
        if (!cardData) return;
        setIsGenerating(true);
        try {
            await downloadCard(cardData, parseFloat(quality), isBack);
        } finally {
            setIsGenerating(false);
        }
    };

    const [shareTarget, setShareTarget] = useState<"front" | "back" | "both" | null>(null);

    const handleShare = async (shareType: "front" | "back" | "both" = "front") => {
        if (!cardData) return;

        setIsGenerating(true);
        setShareTarget(shareType);
        try {
            const scale = parseFloat(quality);
            const filesToShare: File[] = [];

            if (shareType === "front" || shareType === "both") {
                const canvasF = await renderCard(cardData, scale);
                const blobF = await new Promise<Blob | null>(res => canvasF.toBlob(res, "image/png"));
                if (blobF) filesToShare.push(new File([blobF], 'geng-fancard-front.png', { type: "image/png" }));
            }

            if (shareType === "back" || shareType === "both") {
                const canvasB = await renderBackCard(cardData, scale);
                const blobB = await new Promise<Blob | null>(res => canvasB.toBlob(res, "image/png"));
                if (blobB) filesToShare.push(new File([blobB], 'geng-fancard-back.png', { type: "image/png" }));
            }

            if (filesToShare.length === 0) {
                return;
            }

            if (navigator.canShare && navigator.canShare({ files: filesToShare })) {
                try {
                    await navigator.share({
                        title: `My Gen.G Fan Card${shareType === "both" ? "s" : ""}!`,
                        text: "Check out my official Gen.G Fandom card! Generate yours at fancard.gengfandom.fun",
                        files: filesToShare
                    });
                } catch (err) {
                    console.log("Share cancelled or failed", err);
                }
            } else {
                alert("Your browser does not cleanly support native sharing of these images. Please download them and share manually!");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
            setShareTarget(null);
        }
    };

    if (!cardData || !frontPreviewUrl || !backPreviewUrl) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-gold">
                <RefreshCw className="animate-spin w-8 h-8" />
            </div>
        );
    }

    const isPortrait = cardData.aspectRatio === "9:16";
    const currentPreviewUrl = viewSide === "front" ? frontPreviewUrl : backPreviewUrl;

    return (
        <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-12 px-4 relative flex items-center justify-center">
            {/* Background blur */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none">
                <div
                    className="w-full h-full bg-no-repeat bg-cover bg-center blur-3xl saturate-150 transition-all duration-700"
                    style={{ backgroundImage: `url(${currentPreviewUrl})` }}
                />
            </div>

            <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

                {/* Left: Final Card Preview */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center h-fit">

                    {!isPortrait && (
                        <div className="w-full flex justify-center mb-6">
                            {/* Toggle Switches */}
                            <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
                                <button onClick={() => setViewSide("front")} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewSide === "front" ? "bg-gold text-black shadow-lg" : "text-gray-400 hover:text-white"}`}>
                                    Front Side
                                </button>
                                <button onClick={() => setViewSide("back")} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewSide === "back" ? "bg-gold text-black shadow-lg" : "text-gray-400 hover:text-white"}`}>
                                    Back Side
                                </button>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewSide}
                            initial={{ opacity: 0, rotateY: viewSide === "front" ? -90 : 90, scale: 0.95 }}
                            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                            exit={{ opacity: 0, rotateY: viewSide === "front" ? 90 : -90, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className={`relative w-full ${isPortrait ? "max-w-xs md:max-w-[340px] aspect-[9/16]" : "max-w-2xl aspect-[16/9]"} mx-auto rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] bg-black/80`}
                        >
                            <img src={currentPreviewUrl} alt="Your Fan Card" className="w-full h-full object-contain" />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right: Actions */}
                <div className="lg:col-span-5 flex flex-col justify-center space-y-8 bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl h-fit">
                    <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm uppercase tracking-widest font-bold transition-colors w-fit">
                        <ArrowLeft size={16} /> Edit My Card
                    </button>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-heading text-white uppercase tracking-wider mb-2 flex items-center gap-3">
                            <CreditCard className="text-gold w-8 h-8" />
                            READY TO SHARE
                        </h1>
                        <p className="text-gray-400 text-sm leading-relaxed">Your official TIGER NATION card is generated perfectly. Select quality and export!</p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold">Export Quality Multiplier</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setQuality("1")} className={`py-4 rounded-xl border font-bold uppercase tracking-wider text-[11px] md:text-xs transition-all ${quality === "1" ? "border-gold text-gold bg-gold/10" : "border-white/10 text-gray-400 hover:border-gold/50"}`}>
                                Standard (1x)
                            </button>
                            <button onClick={() => setQuality("2")} className={`py-4 rounded-xl border font-bold uppercase tracking-wider text-[11px] md:text-xs transition-all ${quality === "2" ? "border-gold text-gold bg-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "border-white/10 text-gray-400 hover:border-gold/50"}`}>
                                ULTRA HD (2x)
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
                        {isPortrait ? (
                            <button
                                disabled={isGenerating}
                                onClick={() => handleDownload(false)}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-[#e6c86a] to-gold hover:bg-right bg-[length:200%_auto] text-black font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                                <span className="tracking-widest uppercase text-xs">DOWNLOAD CARD</span>
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    disabled={isGenerating}
                                    onClick={() => handleDownload(false)}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-[#e6c86a] to-gold hover:bg-right bg-[length:200%_auto] text-black font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                                    <span className="tracking-widest uppercase text-xs">DL FRONT</span>
                                </button>

                                <button
                                    disabled={isGenerating}
                                    onClick={() => handleDownload(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-black border border-gold text-gold hover:bg-gold/10 font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                                    <span className="tracking-widest uppercase text-xs">DL BACK</span>
                                </button>
                            </div>
                        )}

                        {isPortrait ? (
                            <button
                                disabled={isGenerating}
                                onClick={() => handleShare("front")}
                                className="w-full flex items-center justify-center gap-3 bg-[#111] border border-white/20 hover:border-white/50 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 mt-2"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                                <span className="tracking-[0.2em] uppercase text-sm">Quick Share</span>
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2 mt-2">
                                <button
                                    disabled={isGenerating}
                                    onClick={() => handleShare("front")}
                                    className="w-full flex items-center justify-center gap-3 bg-[#111] border border-white/20 hover:border-white/50 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isGenerating && shareTarget === "front" ? <RefreshCw className="animate-spin w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                                    <span className="tracking-[0.2em] uppercase text-sm">Share Front Only</span>
                                </button>
                                <button
                                    disabled={isGenerating}
                                    onClick={() => handleShare("both")}
                                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gold via-[#e6c86a] to-gold bg-[length:200%_auto] hover:bg-right text-black font-extrabold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isGenerating && shareTarget === "both" ? <RefreshCw className="animate-spin w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                                    <span className="tracking-[0.2em] uppercase text-sm">Share Both Sides</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
