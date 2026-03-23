"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFanCard, type FanCardData } from "./useFanCard";
import playersData from "@/data/players.json";
import { Download, Sparkles, ChevronDown, Check, RefreshCw, Upload, User, Hash, Calendar, Edit3, Award, Image as ImageIcon, Smartphone, Monitor, CreditCard, ArrowRight, ArrowLeft } from "lucide-react";

interface FanCardGeneratorProps {
    initialName?: string;
    memberId?: string;
}

const PLAYERS = playersData.roster.filter((p) => p.roleKey !== "mascot");

const ROLE_LABELS: Record<string, string> = {
    top: "TOP",
    jungle: "JUNGLE",
    mid: "MID",
    adc: "BOT",
    support: "SUPPORT",
};

export default function FanCardGenerator({
    initialName = "GEN.G FAN",
}: FanCardGeneratorProps) {
    const router = useRouter();
    const [displayName, setDisplayName] = useState(initialName);
    const [customMemberId, setCustomMemberId] = useState("");
    const [memberTitle, setMemberTitle] = useState("GENCON");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [dob, setDob] = useState("");
    const [customNote, setCustomNote] = useState("");
    const [selectedPlayer, setSelectedPlayer] = useState(PLAYERS[2]!);
    const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const playerDropRef = useRef<HTMLDivElement>(null);

    const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
    const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
    const [theme, setTheme] = useState<"member" | "bank">("member");
    const [customQrUrl, setCustomQrUrl] = useState("");
    const [step, setStep] = useState<1 | 2>(1);
    const [bankCardNumber, setBankCardNumber] = useState("");
    const [cvv, setCvv] = useState("");

    const { renderCard, renderBackCard, downloadCard } = useFanCard();

    const formattedCustomId = customMemberId.trim() ? (customMemberId.trim().startsWith('#') ? customMemberId.trim() : `#${customMemberId.trim()}`) : "";
    const mId = formattedCustomId || `#${String(Math.abs(displayName.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 137) % 99999).padStart(5, "0")}`;

    const getCardData = useCallback((): FanCardData => ({
        displayName: displayName || "GEN.G FAN",
        role: "fan",
        memberId: mId,
        memberTitle: memberTitle,
        avatarUrl: avatarUrl,
        dob: dob ? dob.split("-").reverse().join("/") : null,
        customNote: customNote || null,
        favoritePlayer: {
            name: selectedPlayer.name,
            roleKey: ROLE_LABELS[selectedPlayer.roleKey] || selectedPlayer.roleKey.toUpperCase(),
            image: selectedPlayer.image || "",
            signatureImg: (selectedPlayer as any).signature || "",
        },
        aspectRatio,
        theme: aspectRatio === "16:9" ? theme : "member",
        customQrUrl: customQrUrl.trim() || null,
        ...(bankCardNumber.trim() ? { bankCardNumber: bankCardNumber.trim() } : {}),
        ...(cvv.trim() ? { cvv: cvv.trim() } : {}),
    }), [displayName, mId, memberTitle, avatarUrl, dob, customNote, selectedPlayer, aspectRatio, theme, customQrUrl, bankCardNumber, cvv]);

    // Force preview to front if switched to Portrait
    useEffect(() => {
        if (aspectRatio === "9:16" && previewSide === "back") {
            setPreviewSide("front");
        }
    }, [aspectRatio, previewSide]);

    // Live preview
    useEffect(() => {
        let cancelled = false;
        const render = async () => {
            try {
                const offscreen = previewSide === "front" 
                    ? await renderCard(getCardData()) 
                    : await renderBackCard(getCardData());
                if (cancelled || !previewCanvasRef.current) return;
                const preview = previewCanvasRef.current;
                const ctx = preview.getContext("2d");
                if (!ctx) return;
                preview.width = offscreen.width;
                preview.height = offscreen.height;
                ctx.clearRect(0, 0, preview.width, preview.height);
                ctx.drawImage(offscreen, 0, 0);
            } catch { /* ignore */ }
        };
        render();
        return () => { cancelled = true; };
    }, [getCardData, renderCard, renderBackCard, previewSide]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (playerDropRef.current && !playerDropRef.current.contains(e.target as Node)) {
                setShowPlayerDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleGenerate = () => {
        setIsDownloading(true);
        try {
            sessionStorage.setItem("geng_fancard_data", JSON.stringify(getCardData()));
            router.push("/result");
        } catch (e) {
            console.error(e);
            alert("Your profile photo is too large. Please use a smaller image.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto pb-12">
            
            {/* Left: Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-start lg:sticky lg:top-24 h-fit">
                <motion.div
                    className={`relative w-full ${aspectRatio === "9:16" ? "aspect-[9/16] max-w-[320px] mx-auto lg:max-w-[400px]" : "aspect-[16/9]"} rounded-2xl overflow-hidden shadow-2xl shadow-gold/10 bg-[#0a0a0a] transition-all duration-300`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <canvas
                        ref={previewCanvasRef}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "auto" }}
                    />
                </motion.div>

                {aspectRatio === "16:9" && (
                    <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl mt-6 backdrop-blur-sm">
                        <button onClick={() => setPreviewSide("front")} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${previewSide === "front" ? "bg-gold text-black shadow-lg" : "text-gray-400 hover:text-white"}`}>
                            Front Side
                        </button>
                        <button onClick={() => setPreviewSide("back")} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${previewSide === "back" ? "bg-gold text-black shadow-lg" : "text-gray-400 hover:text-white"}`}>
                            Back Side
                        </button>
                    </div>
                )}

                <motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="mt-6 text-gray-500 text-sm italic flex items-center gap-2"
                >
                    <Sparkles size={14} className="text-gold" /> Preview generated live. Download for full resolution.
                </motion.p>
            </div>

            {/* Right: Controls */}
            <div className="lg:col-span-5 flex flex-col space-y-4 lg:space-y-6">
                <div className="mb-2 lg:mb-4">
                    <h3 className="font-heading text-3xl lg:text-4xl text-white flex items-center gap-3 uppercase tracking-wider">
                        {step === 1 ? "FORMAT & THEME" : <>TIGER <span className="text-gold">NATION</span> {theme === "bank" ? "BANK" : "ID"}</>}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                        {step === 1 ? "Select your preferred orientation and card style." : "Customize your official Gen.G Fandom card perfectly."}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                {/* Aspect Ratio Toggle */}
                <div>
                    <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">CARD FORMAT</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setAspectRatio("16:9")} 
                            className={`py-3 rounded-xl border font-bold uppercase tracking-wider text-[11px] lg:text-xs transition-all flex items-center justify-center gap-2 ${aspectRatio === "16:9" ? "border-gold text-gold bg-gold/10" : "border-white/10 text-gray-400 hover:border-gold/30 hover:text-white"}`}
                        >
                            <Monitor size={16} /> 16:9 LANDSCAPE
                        </button>
                        <button 
                            onClick={() => setAspectRatio("9:16")} 
                            className={`py-3 rounded-xl border font-bold uppercase tracking-wider text-[11px] lg:text-xs transition-all flex items-center justify-center gap-2 ${aspectRatio === "9:16" ? "border-gold text-gold bg-gold/10" : "border-white/10 text-gray-400 hover:border-gold/30 hover:text-white"}`}
                        >
                            <Smartphone size={16} /> 9:16 PORTRAIT
                        </button>
                    </div>
                </div>
                
                {/* Card Theme Toggle */}
                {aspectRatio === "16:9" && (
                    <div>
                        <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">CARD THEME (LANDSCAPE ONLY)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setTheme("member")} 
                                className={`py-3 rounded-xl border font-bold uppercase tracking-wider text-[11px] lg:text-xs transition-all flex items-center justify-center gap-2 ${theme === "member" ? "border-gold text-gold bg-gold/10" : "border-white/10 text-gray-400 hover:border-gold/30 hover:text-white"}`}
                            >
                                <User size={16} /> MEMBER CARD
                            </button>
                            <button 
                                onClick={() => setTheme("bank")} 
                                className={`py-3 rounded-xl border font-bold uppercase tracking-wider text-[11px] lg:text-xs transition-all flex items-center justify-center gap-2 ${theme === "bank" ? "border-gold text-gold bg-gold/10" : "border-white/10 text-gray-400 hover:border-gold/30 hover:text-white"}`}
                            >
                                <CreditCard className="w-4 h-4" /> VIP BANK CARD
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setStep(2)}
                    className="w-full py-4 rounded-xl font-heading text-xl uppercase tracking-widest bg-gold text-black hover:bg-white transition-colors flex items-center justify-center gap-2 mt-8 shadow-lg shadow-gold/20 hover:shadow-gold/40"
                >
                    CONTINUE <ArrowRight size={20} />
                </button>
            </motion.div>
        ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4 lg:space-y-6">
                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors">
                    <ArrowLeft size={14} /> BACK TO FORMAT
                </button>

                {/* SECTION: PROFILE */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 lg:p-6 backdrop-blur-md shadow-xl">
                        <h4 className="flex items-center gap-2 text-gold font-bold text-[11px] tracking-widest uppercase mb-4 lg:mb-5 border-b border-white/5 pb-2 lg:pb-3">
                            <User size={14} /> Member Profile
                        </h4>
                        
                        <div className="space-y-4 lg:space-y-5">
                            {/* Avatar Upload */}
                            {!(aspectRatio === "16:9" && theme === "bank") && (
                            <div>
                                <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">
                                    PROFILE AVATAR
                                </label>
                                <div className="flex items-center gap-4">
                                    {avatarUrl ? (
                                        <div className="relative group">
                                            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border border-gold shadow-lg shadow-gold/20" />
                                            <button onClick={() => setAvatarUrl(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <RefreshCw size={12} className="rotate-45" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center">
                                            <ImageIcon size={24} className="text-gray-600" />
                                        </div>
                                    )}
                                    <label className="flex-1 flex flex-col items-center justify-center gap-2 bg-white/[0.02] border border-dashed border-white/10 hover:border-gold/50 rounded-2xl px-4 py-3 cursor-pointer transition-all group hover:bg-gold/5">
                                        <div className="flex items-center gap-2">
                                            <Upload size={14} className="text-gray-500 group-hover:text-gold transition-colors" />
                                            <span className="text-xs text-gray-400 group-hover:text-gold font-bold tracking-wider uppercase transition-colors">
                                                {avatarUrl ? 'REPLACE IMAGE' : 'UPLOAD IMAGE'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-medium">1:1 Square recommended</span>
                                        <input type="file" accept="image/*" className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const img = new Image();
                                                img.onload = () => {
                                                    const canvas = document.createElement("canvas");
                                                    let w = img.width, h = img.height;
                                                    const max = 300;
                                                    if (w > max || h > max) {
                                                        const ratio = Math.min(max / w, max / h);
                                                        w *= ratio; h *= ratio;
                                                    }
                                                    canvas.width = w; canvas.height = h;
                                                    const ctx = canvas.getContext("2d");
                                                    if (ctx) {
                                                        ctx.drawImage(img, 0, 0, w, h);
                                                        setAvatarUrl(canvas.toDataURL("image/jpeg", 0.8));
                                                    }
                                                };
                                                img.src = URL.createObjectURL(file);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">DISPLAY NAME</label>
                                    <div className="relative group">
                                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" />
                                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value.slice(0, 15))}
                                            placeholder="Your Name"
                                            className="w-full bg-white/[0.03] border border-white/10 hover:border-gold/30 focus:border-gold focus:ring-1 focus:ring-gold rounded-xl pl-10 pr-4 py-2.5 lg:py-3 text-[13px] lg:text-sm text-white placeholder:text-gray-600 outline-none transition-all uppercase font-medium tracking-wider"
                                        />
                                    </div>
                                    <div className="text-right mt-1 text-[10px] text-gray-600">{displayName.length}/15</div>
                                </div>

                                {/* ID Input */}
                                <div>
                                    <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">CUSTOM ID</label>
                                    <div className="relative group">
                                        <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" />
                                        <input type="text" value={customMemberId} onChange={(e) => setCustomMemberId(e.target.value.slice(0, 10))}
                                            placeholder="e.g. #00123"
                                            className="w-full bg-white/[0.03] border border-white/10 hover:border-gold/30 focus:border-gold focus:ring-1 focus:ring-gold rounded-xl pl-10 pr-4 py-2.5 lg:py-3 text-[13px] lg:text-sm text-white placeholder:text-gray-600 outline-none transition-all uppercase font-medium tracking-wider"
                                        />
                                    </div>
                                    <div className="text-right mt-1 text-[10px] text-gray-600">{customMemberId.length}/10</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: CARD DETAILS */}
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 lg:p-6 backdrop-blur-md shadow-xl">
                        <h4 className="flex items-center gap-2 text-gold font-bold text-[11px] tracking-widest uppercase mb-4 lg:mb-5 border-b border-white/5 pb-2 lg:pb-3">
                            <Award size={14} /> Card Details
                        </h4>

                        <div className="space-y-4 lg:space-y-5">


                            {/* Favorite Player Select */}
                            <div>
                                <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">FAVORITE PLAYER</label>
                                <div className="relative" ref={playerDropRef}>
                                    <button onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
                                        className="w-full flex items-center justify-between gap-3 bg-white/[0.03] border border-white/10 hover:border-gold/50 rounded-xl px-4 py-2.5 lg:py-3 transition-colors group focus:ring-1 focus:ring-gold"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={selectedPlayer.image || ""} alt={selectedPlayer.name}
                                                className="w-8 h-8 rounded-full object-cover bg-gray-800 border border-gold/30 group-hover:border-gold transition-colors" />
                                            <div className="text-left">
                                                <div className="text-sm font-bold text-white uppercase tracking-wider">{selectedPlayer.name}</div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-widest">{ROLE_LABELS[selectedPlayer.roleKey] || selectedPlayer.roleKey}</div>
                                            </div>
                                        </div>
                                        <ChevronDown size={16} className={`text-gray-500 group-hover:text-gold transition-transform ${showPlayerDropdown ? "rotate-180" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                        {showPlayerDropdown && (
                                            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.15 }}
                                                className="absolute z-50 mt-2 w-full bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl p-2"
                                            >
                                                {PLAYERS.map((p) => (
                                                    <button key={p.id} onClick={() => { setSelectedPlayer(p); setShowPlayerDropdown(false); }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left ${selectedPlayer.id === p.id ? "bg-gold/10 text-gold" : "text-white"}`}
                                                    >
                                                        <img src={p.image || ""} alt={p.name} className="w-8 h-8 rounded-full object-cover bg-black" />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold uppercase tracking-wider">{p.name}</div>
                                                            <div className="text-[10px] opacity-70 uppercase tracking-widest">{ROLE_LABELS[p.roleKey] || p.roleKey}</div>
                                                        </div>
                                                        {selectedPlayer.id === p.id && <Check size={16} className="text-gold" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Title Selection */}
                            <div>
                                <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">MEMBER TITLE</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {["GENCON", "CHURCH OF CHOVY", "TỔNG TÀI KIIN", "GOAT DURO", "QUÝ NGÀI THƯỚC KẺ", "JUGKING"].map((title) => (
                                        <button key={title} onClick={() => setMemberTitle(title)}
                                            className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-lg border transition-all ${
                                                memberTitle === title ? "bg-gold text-black border-gold shadow-[0_0_10px_rgba(212,175,55,0.3)] scale-105" : "bg-white/[0.03] text-gray-400 border-white/10 hover:border-gold/50 hover:text-white"
                                            }`}
                                        >
                                            {title}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative group">
                                    <Award size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" />
                                    <input type="text" value={memberTitle} onChange={(e) => setMemberTitle(e.target.value.slice(0, 20))}
                                        placeholder="Customize your title..."
                                        className="w-full bg-white/[0.03] border border-white/10 hover:border-gold/30 focus:border-gold focus:ring-1 focus:ring-gold rounded-xl pl-10 pr-4 py-2.5 lg:py-3 text-[13px] lg:text-sm text-white placeholder:text-gray-600 outline-none transition-all uppercase font-medium tracking-wider"
                                    />
                                </div>
                                <div className="text-right mt-1 text-[10px] text-gray-600">{memberTitle.length}/20</div>
                            </div>

                            {!(aspectRatio === "16:9" && theme === "bank") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">DOB (OPTIONAL)</label>
                                    <div className="relative group">
                                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" />
                                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 hover:border-gold/30 focus:border-gold focus:ring-1 focus:ring-gold rounded-xl pl-10 pr-4 py-2.5 lg:py-3 text-[13px] lg:text-sm text-white placeholder:text-gray-600 outline-none transition-all font-medium tracking-wider uppercase [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">NOTE (OPTIONAL)</label>
                                    <div className="relative group">
                                        <Edit3 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" />
                                        <input type="text" value={customNote} onChange={(e) => setCustomNote(e.target.value.slice(0, 45))}
                                            placeholder="A short message..."
                                            className="w-full bg-white/[0.03] border border-white/10 hover:border-gold/30 focus:border-gold focus:ring-1 focus:ring-gold rounded-xl pl-10 pr-4 py-2.5 lg:py-3 text-[13px] lg:text-sm text-white placeholder:text-gray-600 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                            )}

                            {aspectRatio === "16:9" && theme === "bank" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">CARD NUMBER (16 DIGITS)</label>
                                        <div className="relative group">
                                            <CreditCard size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" />
                                            <input type="text" value={bankCardNumber} onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, '').substring(0, 16);
                                                val = val.replace(/(.{4})/g, '$1 ').trim();
                                                setBankCardNumber(val);
                                            }}
                                                placeholder="e.g. 5241 1234 5678 9012"
                                                className="w-full bg-white/[0.03] border border-white/10 hover:border-gold/30 focus:border-gold focus:ring-1 focus:ring-gold rounded-xl pl-10 pr-4 py-2.5 lg:py-3 text-[13px] lg:text-sm text-white placeholder:text-gray-600 outline-none transition-all font-medium tracking-wider"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-2">CVV (3-4 DIGITS)</label>
                                        <div className="relative group">
                                            <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" />
                                            <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                                                placeholder="e.g. 024"
                                                className="w-full bg-white/[0.03] border border-white/10 hover:border-gold/30 focus:border-gold focus:ring-1 focus:ring-gold rounded-xl pl-10 pr-4 py-2.5 lg:py-3 text-[13px] lg:text-sm text-white placeholder:text-gray-600 outline-none transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 lg:pt-6">
                        <button onClick={handleGenerate}
                            className="w-full relative group overflow-hidden rounded-xl bg-gold text-black font-heading text-xl lg:text-2xl uppercase tracking-widest py-4 lg:py-5 flex justify-center items-center font-bold shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] transition-all transform hover:-translate-y-1"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                <Sparkles size={24} className="group-hover:animate-spin-slow" />
                                ISSUE SECURE ID CARD
                            </span>
                        </button>
                    </div>
                </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
