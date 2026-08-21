"use client";

import React, { useMemo, useState } from "react";
import DashSidebar from "@/components/creator-dashboard/DashSidebar";
import DashTopbar from "@/components/creator-dashboard/DashTopbar";
import { useDashPrefs } from "@/hooks/use-dash-prefs";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { useWhatsappPage } from "@/hooks/creator-dashboard/use-whatsapp-page";
import { useWhatsappSession } from "@/hooks/creator-dashboard/use-whatsapp-session";
import { whatsappApi } from "@/lib/api/whatsapp.api";
import type {
    WhatsappAutomation,
    WhatsappAutomationTrigger,
    WhatsappAudienceType,
    WhatsappCampaign,
} from "@/lib/api/whatsapp.api";
import {
    AlertCircle,
    CheckCheck,
    Clock,
    Eye,
    Inbox,
    Link2,
    Loader2,
    MessageSquare,
    Phone,
    Plus,
    QrCode,
    RefreshCcw,
    Send,
    Sparkles,
    Trash2,
    Unplug,
    Upload,
    Users,
    X,
    Zap,
} from "lucide-react";

const AUDIENCES: Array<{ value: WhatsappAudienceType; label: string }> = [
    { value: "all_members", label: "All opted-in contacts" },
    { value: "paid_members", label: "Paid members" },
    { value: "free_members", label: "Free members" },
    { value: "course_enrolled", label: "Course enrolled" },
    { value: "challenge_participants", label: "Challenge participants" },
    { value: "event_registrants", label: "Event registrants" },
    { value: "inactive_users", label: "Inactive users" },
];

const STATUS_LABEL: Record<string, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    sending: "Sending",
    sent: "Sent",
    failed: "Failed",
    cancelled: "Cancelled",
};

const AUTOMATION_TRIGGERS: Array<{
    value: WhatsappAutomationTrigger;
    label: string;
}> = [
    { value: "COMMUNITY_JOIN", label: "Community join" },
    { value: "PURCHASE_COMPLETED", label: "Purchase completed" },
    { value: "COURSE_ENROLLED", label: "Course enrolled" },
    { value: "COURSE_COMPLETED", label: "Course completed" },
    { value: "CHALLENGE_JOINED", label: "Challenge joined" },
    { value: "EVENT_REGISTERED", label: "Event registered" },
    { value: "INACTIVE_7_DAYS", label: "Inactive 7 days" },
    { value: "INACTIVE_30_DAYS", label: "Inactive 30 days" },
];

function pct(value: number, total: number) {
    return total > 0 ? Math.round((value / total) * 100) : 0;
}

function getId(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value._id) return getId(value._id);
    if (value.id) return getId(value.id);
    if (typeof value.toString === "function") return value.toString();
    return "";
}

function KpiCard({
    icon,
    label,
    value,
    sub,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    color: string;
}) {
    return (
        <div
            className="rounded-xl p-4 flex gap-3 items-start"
            style={{
                background: "var(--white)",
                border: "1px solid var(--bd)",
            }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}1a`, color }}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <p
                    className="text-[22px] font-bold leading-tight"
                    style={{ color: "var(--t1)" }}
                >
                    {value}
                </p>
                <p
                    className="text-[12px] font-medium mt-0.5"
                    style={{ color: "var(--t2)" }}
                >
                    {label}
                </p>
                <p
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: "var(--t3)" }}
                >
                    {sub}
                </p>
            </div>
        </div>
    );
}

function WaPreview({ body }: { body: string }) {
    const now = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    return (
        <div
            className="overflow-hidden rounded-xl"
            style={{ background: "#e5ddd5" }}
        >
            <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: "#075e54" }}
            >
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                    style={{ background: "#128c7e", color: "#fff" }}
                >
                    Ch
                </div>
                <div>
                    <p className="text-[13px] font-semibold text-white">
                        Chabaqa
                    </p>
                    <p
                        className="text-[11px]"
                        style={{ color: "rgba(255,255,255,.7)" }}
                    >
                        Business Account
                    </p>
                </div>
                <Phone
                    className="w-4 h-4 text-white ml-auto"
                    strokeWidth={1.7}
                />
            </div>
            <div className="p-4 min-h-[180px] flex items-end justify-end">
                <div
                    className="max-w-[84%] rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm"
                    style={{ background: "#dcf8c6" }}
                >
                    <p
                        className="text-[13px] leading-relaxed whitespace-pre-wrap"
                        style={{ color: "#111" }}
                    >
                        {body || "Your message preview appears here."}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <p className="text-[11px]" style={{ color: "#777" }}>
                            {now}
                        </p>
                        <CheckCheck
                            className="w-3 h-3"
                            style={{ color: "#34b7f1" }}
                            strokeWidth={1.7}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConnectionPanel({
    session,
    health,
    qrCodeData,
    pairingCode,
    loading,
    error,
    onStart,
    onRequestPairingCode,
    onDisconnect,
    onRefreshQr,
}: {
    session: any;
    health?: any;
    qrCodeData?: string;
    pairingCode?: string;
    loading: boolean;
    error: string | null;
    onStart: () => void;
    onRequestPairingCode: (phone: string) => void;
    onDisconnect: () => void;
    onRefreshQr: () => void;
}) {
    const [pairingPhone, setPairingPhone] = useState("");
    const connected = session?.status === "ready";
    const disabled =
        health?.enabled === false || health?.openwa?.authenticated === false;
    return (
        <section
            className="rounded-xl p-4 mb-5"
            style={{
                background: "var(--white)",
                border: "1px solid var(--bd)",
            }}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p
                        className="text-[13px] font-bold"
                        style={{ color: "var(--t1)" }}
                    >
                        WhatsApp connection
                    </p>
                    <p
                        className="text-[12px] mt-1"
                        style={{ color: "var(--t3)" }}
                    >
                        {connected
                            ? `Connected${session?.phone ? ` to ${session.phone}` : ""}`
                            : session?.status
                              ? `Current state: ${session.status.replace(/_/g, " ")}`
                              : "Connect a community WhatsApp account before sending campaigns."}
                    </p>
                    {disabled && (
                        <p
                            className="mt-2 flex items-center gap-1 text-[12px]"
                            style={{ color: "#dc2626" }}
                        >
                            <AlertCircle className="w-3.5 h-3.5" /> WhatsApp is
                            not fully enabled. Configure OpenWA API key and
                            enable the integration before connecting.
                        </p>
                    )}
                    {error && (
                        <p
                            className="mt-2 flex items-center gap-1 text-[12px]"
                            style={{ color: "#dc2626" }}
                        >
                            <AlertCircle className="w-3.5 h-3.5" /> {error}
                        </p>
                    )}
                </div>
                <div className="flex gap-2 shrink-0">
                    {!connected && (
                        <button
                            onClick={onStart}
                            disabled={loading || disabled}
                            className="h-9 px-4 rounded-xl text-[12px] font-bold text-white flex items-center gap-2 disabled:opacity-50"
                            style={{ background: "#25d366" }}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Link2 className="w-4 h-4" />
                            )}{" "}
                            Connect
                        </button>
                    )}
                    {connected && (
                        <button
                            onClick={onDisconnect}
                            disabled={loading}
                            className="h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-2 disabled:opacity-50"
                            style={{
                                background: "rgba(239,68,68,.08)",
                                color: "#dc2626",
                            }}
                        >
                            <Unplug className="w-4 h-4" /> Disconnect
                        </button>
                    )}
                    {!connected && session && (
                        <button
                            onClick={onRefreshQr}
                            className="h-9 w-9 rounded-xl flex items-center justify-center"
                            style={{
                                background: "var(--bg)",
                                color: "var(--t2)",
                                border: "1px solid var(--bd)",
                            }}
                            aria-label="Refresh QR"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            {!connected && (
                <div
                    className="mt-4 rounded-xl p-3"
                    style={{
                        background: "var(--bg)",
                        border: "1px solid var(--bd)",
                    }}
                >
                    <p
                        className="text-[12px] font-bold mb-2"
                        style={{ color: "var(--t1)" }}
                    >
                        Pair with phone number instead
                    </p>
                    <div className="flex gap-2">
                        <input
                            value={pairingPhone}
                            onChange={(e) => setPairingPhone(e.target.value)}
                            placeholder="21650123456"
                            className="h-9 flex-1 rounded-xl px-3 text-[12px] outline-none"
                            style={{
                                border: "1px solid var(--bd)",
                                background: "var(--white)",
                                color: "var(--t1)",
                            }}
                        />
                        <button
                            onClick={() =>
                                onRequestPairingCode(
                                    pairingPhone.replace(/\D/g, ""),
                                )
                            }
                            disabled={
                                loading ||
                                disabled ||
                                !pairingPhone.replace(/\D/g, "")
                            }
                            className="h-9 px-3 rounded-xl text-[12px] font-bold text-white disabled:opacity-50"
                            style={{ background: "#25d366" }}
                        >
                            Get code
                        </button>
                    </div>
                    <p
                        className="mt-2 text-[11px]"
                        style={{ color: "var(--t3)" }}
                    >
                        Enter country code + phone digits only, for example
                        21650123456.
                    </p>
                    {pairingCode && (
                        <p
                            className="mt-2 text-[18px] font-black tracking-widest"
                            style={{ color: "var(--t1)" }}
                        >
                            {pairingCode}
                        </p>
                    )}
                </div>
            )}
            {!connected && qrCodeData && (
                <div className="mt-4 flex items-center gap-4">
                    {qrCodeData.startsWith("data:image") ? (
                        <img
                            src={qrCodeData}
                            alt="WhatsApp QR code"
                            className="h-36 w-36 rounded-xl border bg-white object-contain p-2"
                        />
                    ) : (
                        <div className="h-36 w-36 rounded-xl border bg-white p-2 text-[10px] break-all overflow-hidden">
                            {qrCodeData}
                        </div>
                    )}
                    <div>
                        <p
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--t1)" }}
                        >
                            Scan with WhatsApp
                        </p>
                        <p
                            className="text-[12px] mt-1 max-w-md"
                            style={{ color: "var(--t3)" }}
                        >
                            Open WhatsApp, choose Linked devices, then scan this
                            code. Keep the device connected for campaign
                            delivery.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

function ContactImporter({
    onImport,
}: {
    onImport: (data: {
        name: string;
        phoneE164: string;
        consentProof: string;
    }) => Promise<void>;
}) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [consentProof, setConsentProof] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        setError(null);
        if (!name.trim() || !phone.trim() || !consentProof.trim()) {
            setError("Name, E.164 phone, and consent proof are required.");
            return;
        }
        setSaving(true);
        try {
            await onImport({
                name: name.trim(),
                phoneE164: phone.trim(),
                consentProof: consentProof.trim(),
            });
            setName("");
            setPhone("");
            setConsentProof("");
        } catch (e: any) {
            setError(e?.message || "Failed to import contact");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section
            className="rounded-xl p-4"
            style={{
                background: "var(--white)",
                border: "1px solid var(--bd)",
            }}
        >
            <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4" style={{ color: "#25d366" }} />
                <p
                    className="text-[13px] font-bold"
                    style={{ color: "var(--t1)" }}
                >
                    Import opted-in contact
                </p>
            </div>
            <div className="grid gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contact name"
                    className="h-10 rounded-xl px-3 text-[13px] outline-none"
                    style={{
                        border: "1px solid var(--bd)",
                        background: "var(--bg)",
                        color: "var(--t1)",
                    }}
                />
                <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+21650123456"
                    className="h-10 rounded-xl px-3 text-[13px] outline-none"
                    style={{
                        border: "1px solid var(--bd)",
                        background: "var(--bg)",
                        color: "var(--t1)",
                    }}
                />
                <textarea
                    value={consentProof}
                    onChange={(e) => setConsentProof(e.target.value)}
                    placeholder="Consent proof, e.g. opted in at checkout or signed up for WhatsApp updates"
                    rows={3}
                    className="rounded-xl px-3 py-2 text-[13px] outline-none resize-none"
                    style={{
                        border: "1px solid var(--bd)",
                        background: "var(--bg)",
                        color: "var(--t1)",
                    }}
                />
                <p className="text-[11px]" style={{ color: "var(--t3)" }}>
                    Only import contacts who explicitly agreed to receive
                    WhatsApp messages. Reply STOP opt-out is appended
                    automatically.
                </p>
                {error && (
                    <p className="text-[12px]" style={{ color: "#dc2626" }}>
                        {error}
                    </p>
                )}
                <button
                    onClick={submit}
                    disabled={saving}
                    className="h-10 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "#25d366" }}
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}{" "}
                    Add contact
                </button>
            </div>
        </section>
    );
}

function CampaignComposer({
    open,
    onClose,
    onCreate,
    onPreview,
    communityId,
}: {
    open: boolean;
    onClose: () => void;
    onCreate: (data: {
        title: string;
        body: string;
        targetAudience: WhatsappAudienceType;
        scheduledAt?: string;
    }) => Promise<void>;
    onPreview: (audience: WhatsappAudienceType) => Promise<any>;
    communityId?: string;
}) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [audience, setAudience] =
        useState<WhatsappAudienceType>("all_members");
    const [scheduledAt, setScheduledAt] = useState("");
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [aiGoal, setAiGoal] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiVariants, setAiVariants] = useState<string[]>([]);

    if (!open) return null;

    const generateAiDraft = async () => {
        if (!communityId) {
            setAiError("Select a community first.");
            return;
        }
        if (!aiGoal.trim()) {
            setAiError("Describe the goal of your broadcast first.");
            return;
        }
        setAiLoading(true);
        setAiError(null);
        setAiVariants([]);
        try {
            const res = await whatsappApi.generateBroadcastDraft(communityId, {
                goal: aiGoal.trim(),
                audience,
            });
            if (res.skipped) {
                setAiError(res.reason || "AI is not configured on this server.");
            } else if (res.message) {
                setBody(res.message);
                setAiVariants(res.variants || []);
            } else {
                setAiError("AI did not return a draft. Try again.");
            }
        } catch (e: any) {
            setAiError(e?.message || "Failed to generate draft");
        } finally {
            setAiLoading(false);
        }
    };

    const submit = async () => {
        setError(null);
        if (!title.trim() || !body.trim()) {
            setError("Title and message are required.");
            return;
        }
        setSaving(true);
        try {
            await onCreate({
                title: title.trim(),
                body: body.trim(),
                targetAudience: audience,
                scheduledAt: scheduledAt
                    ? new Date(scheduledAt).toISOString()
                    : undefined,
            });
            setTitle("");
            setBody("");
            setScheduledAt("");
            setPreview(null);
            onClose();
        } catch (e: any) {
            setError(e?.message || "Failed to create campaign");
        } finally {
            setSaving(false);
        }
    };

    const loadPreview = async () => {
        setError(null);
        try {
            setPreview(await onPreview(audience));
        } catch (e: any) {
            setError(e?.message || "Failed to preview audience");
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[70] bg-black/40"
                onClick={onClose}
            />
            <aside
                className="fixed right-0 top-0 z-[80] h-screen w-full max-w-[480px] overflow-y-auto"
                style={{
                    background: "var(--white)",
                    borderLeft: "1px solid var(--bd)",
                }}
            >
                <div
                    className="p-5 flex items-center justify-between"
                    style={{ borderBottom: "1px solid var(--bd)" }}
                >
                    <div>
                        <p
                            className="text-[16px] font-bold"
                            style={{ color: "var(--t1)" }}
                        >
                            New WhatsApp campaign
                        </p>
                        <p
                            className="text-[12px]"
                            style={{ color: "var(--t3)" }}
                        >
                            Create a consent-based broadcast.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--bg)", color: "var(--t2)" }}
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 grid gap-4">
                    <label className="grid gap-1">
                        <span
                            className="text-[12px] font-semibold"
                            style={{ color: "var(--t2)" }}
                        >
                            Title
                        </span>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-10 rounded-xl px-3 text-[13px] outline-none"
                            style={{
                                border: "1px solid var(--bd)",
                                background: "var(--bg)",
                                color: "var(--t1)",
                            }}
                        />
                    </label>
                    <label className="grid gap-1">
                        <span
                            className="text-[12px] font-semibold"
                            style={{ color: "var(--t2)" }}
                        >
                            Audience
                        </span>
                        <select
                            value={audience}
                            onChange={(e) =>
                                setAudience(
                                    e.target.value as WhatsappAudienceType,
                                )
                            }
                            className="h-10 rounded-xl px-3 text-[13px] outline-none"
                            style={{
                                border: "1px solid var(--bd)",
                                background: "var(--bg)",
                                color: "var(--t1)",
                            }}
                        >
                            {AUDIENCES.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        onClick={loadPreview}
                        className="h-9 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2"
                        style={{
                            background: "rgba(37,211,102,.10)",
                            color: "#16a34a",
                        }}
                    >
                        <Users className="w-4 h-4" /> Preview audience
                    </button>
                    {preview && (
                        <div
                            className="rounded-xl p-3 text-[12px]"
                            style={{
                                background: "var(--bg)",
                                color: "var(--t2)",
                                border: "1px solid var(--bd)",
                            }}
                        >
                            {preview.eligible} eligible contacts,{" "}
                            {preview.skipped} skipped, {preview.remainingQuota}{" "}
                            messages remaining.
                        </div>
                    )}
                    <label className="grid gap-1">
                        <span
                            className="text-[12px] font-semibold"
                            style={{ color: "var(--t2)" }}
                        >
                            Message
                        </span>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={6}
                            className="rounded-xl px-3 py-2 text-[13px] outline-none resize-none"
                            style={{
                                border: "1px solid var(--bd)",
                                background: "var(--bg)",
                                color: "var(--t1)",
                            }}
                        />
                    </label>
                    {aiVariants.length > 0 && (
                        <div className="grid gap-2">
                            <span
                                className="text-[11px] font-semibold"
                                style={{ color: "var(--t3)" }}
                            >
                                Short variants (tap to use)
                            </span>
                            {aiVariants.map((variant, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setBody(variant)}
                                    className="text-left rounded-xl p-3 text-[12px]"
                                    style={{
                                        border: "1px solid var(--bd)",
                                        background: "var(--bg)",
                                        color: "var(--t2)",
                                    }}
                                >
                                    {variant}
                                </button>
                            ))}
                        </div>
                    )}
                    <label className="grid gap-1">
                        <span
                            className="text-[12px] font-semibold flex items-center gap-1.5"
                            style={{ color: "var(--t2)" }}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[#8e78fb]" />
                            Draft with AI (optional)
                        </span>
                        <textarea
                            value={aiGoal}
                            onChange={(e) => setAiGoal(e.target.value)}
                            rows={2}
                            placeholder="e.g. Remind members about the new course launch and offer a 20% discount"
                            className="rounded-xl px-3 py-2 text-[13px] outline-none resize-none"
                            style={{
                                border: "1px solid var(--bd)",
                                background: "var(--bg)",
                                color: "var(--t1)",
                            }}
                        />
                    </label>
                    <button
                        onClick={generateAiDraft}
                        disabled={aiLoading || !communityId}
                        className="h-9 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{
                            background: "rgba(142,120,251,.12)",
                            color: "#8e78fb",
                        }}
                    >
                        {aiLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}{" "}
                        Generate AI draft
                    </button>
                    {aiError && (
                        <p
                            className="text-[12px]"
                            style={{ color: "#dc2626" }}
                        >
                            {aiError}
                        </p>
                    )}
                    <label className="grid gap-1">
                        <span
                            className="text-[12px] font-semibold"
                            style={{ color: "var(--t2)" }}
                        >
                            Schedule (optional)
                        </span>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="h-10 rounded-xl px-3 text-[13px] outline-none"
                            style={{
                                border: "1px solid var(--bd)",
                                background: "var(--bg)",
                                color: "var(--t1)",
                            }}
                        />
                    </label>
                    <WaPreview body={body} />
                    {error && (
                        <p className="text-[12px]" style={{ color: "#dc2626" }}>
                            {error}
                        </p>
                    )}
                </div>
                <div
                    className="p-5"
                    style={{ borderTop: "1px solid var(--bd)" }}
                >
                    <button
                        onClick={submit}
                        disabled={saving}
                        className="h-10 w-full rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "#25d366" }}
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}{" "}
                        Save campaign
                    </button>
                </div>
            </aside>
        </>
    );
}

function CampaignRow({
    campaign,
    onPreview,
    onSend,
    onCancel,
    onDelete,
}: {
    campaign: WhatsappCampaign;
    onPreview: (campaign: WhatsappCampaign) => void;
    onSend: (id: string) => void;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const canSend = ["draft", "scheduled", "failed"].includes(campaign.status);
    const canCancel = ["scheduled", "sending"].includes(campaign.status);
    return (
        <div
            className="rounded-xl p-4 flex items-start gap-4"
            style={{
                background: "var(--white)",
                border: "1px solid var(--bd)",
            }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(37,211,102,.12)", color: "#25d366" }}
            >
                <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                    <p
                        className="text-[14px] font-bold truncate"
                        style={{ color: "var(--t1)" }}
                    >
                        {campaign.title}
                    </p>
                    <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{
                            background: "var(--bg)",
                            color: "var(--t3)",
                            border: "1px solid var(--bd)",
                        }}
                    >
                        {STATUS_LABEL[campaign.status] || campaign.status}
                    </span>
                </div>
                <p
                    className="mt-1 text-[12px] line-clamp-1"
                    style={{ color: "var(--t3)" }}
                >
                    {campaign.body}
                </p>
                <div
                    className="mt-3 flex flex-wrap gap-4 text-[11px]"
                    style={{ color: "var(--t3)" }}
                >
                    <span>{campaign.totalRecipients} recipients</span>
                    <span>{campaign.sentCount} sent</span>
                    <span>{campaign.deliveredCount} delivered</span>
                    <span>{campaign.readCount} read</span>
                    <span>{campaign.repliedCount} replies</span>
                </div>
            </div>
            <div className="flex gap-1 shrink-0">
                <button
                    onClick={() => onPreview(campaign)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{
                        background: "rgba(37,211,102,.10)",
                        color: "#16a34a",
                    }}
                    aria-label="Preview"
                >
                    <Eye className="w-4 h-4" />
                </button>
                {canSend && (
                    <button
                        onClick={() => onSend(campaign._id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{
                            background: "rgba(37,211,102,.10)",
                            color: "#16a34a",
                        }}
                        aria-label="Send"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                )}
                {canCancel && (
                    <button
                        onClick={() => onCancel(campaign._id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{
                            background: "rgba(251,146,60,.12)",
                            color: "var(--orange)",
                        }}
                        aria-label="Cancel"
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(campaign._id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{
                        background: "rgba(239,68,68,.08)",
                        color: "#dc2626",
                    }}
                    aria-label="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function AutomationPanel({
    automations,
    onCreate,
    onToggle,
}: {
    automations: WhatsappAutomation[];
    onCreate: (data: {
        name: string;
        trigger: WhatsappAutomationTrigger;
        delayHours?: number;
        body: string;
        isActive?: boolean;
    }) => Promise<void>;
    onToggle: (automation: WhatsappAutomation) => Promise<void>;
}) {
    const [name, setName] = useState("");
    const [trigger, setTrigger] =
        useState<WhatsappAutomationTrigger>("COMMUNITY_JOIN");
    const [delayHours, setDelayHours] = useState("0");
    const [body, setBody] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        setError(null);
        if (!name.trim() || !body.trim()) {
            setError("Name and message are required.");
            return;
        }
        setSaving(true);
        try {
            await onCreate({
                name: name.trim(),
                trigger,
                delayHours: Math.max(0, Number(delayHours || 0)),
                body: body.trim(),
                isActive: true,
            });
            setName("");
            setBody("");
            setDelayHours("0");
        } catch (e: any) {
            setError(e?.message || "Failed to save automation");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section
            className="rounded-xl p-4"
            style={{
                background: "var(--white)",
                border: "1px solid var(--bd)",
            }}
        >
            <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" style={{ color: "#25d366" }} />
                <p
                    className="text-[13px] font-bold"
                    style={{ color: "var(--t1)" }}
                >
                    Automations
                </p>
            </div>
            <div className="grid gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Automation name"
                    className="h-10 rounded-xl px-3 text-[13px] outline-none"
                    style={{
                        border: "1px solid var(--bd)",
                        background: "var(--bg)",
                        color: "var(--t1)",
                    }}
                />
                <div className="grid grid-cols-[1fr_84px] gap-2">
                    <select
                        value={trigger}
                        onChange={(e) =>
                            setTrigger(
                                e.target.value as WhatsappAutomationTrigger,
                            )
                        }
                        className="h-10 rounded-xl px-3 text-[13px] outline-none"
                        style={{
                            border: "1px solid var(--bd)",
                            background: "var(--bg)",
                            color: "var(--t1)",
                        }}
                    >
                        {AUTOMATION_TRIGGERS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        min="0"
                        value={delayHours}
                        onChange={(e) => setDelayHours(e.target.value)}
                        className="h-10 rounded-xl px-3 text-[13px] outline-none"
                        style={{
                            border: "1px solid var(--bd)",
                            background: "var(--bg)",
                            color: "var(--t1)",
                        }}
                        aria-label="Delay hours"
                    />
                </div>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    placeholder="Automation message"
                    className="rounded-xl px-3 py-2 text-[13px] outline-none resize-none"
                    style={{
                        border: "1px solid var(--bd)",
                        background: "var(--bg)",
                        color: "var(--t1)",
                    }}
                />
                {error && (
                    <p className="text-[12px]" style={{ color: "#dc2626" }}>
                        {error}
                    </p>
                )}
                <button
                    onClick={submit}
                    disabled={saving}
                    className="h-10 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "#25d366" }}
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}{" "}
                    Add automation
                </button>
            </div>
            <div className="grid gap-2 mt-4">
                {automations.length === 0 ? (
                    <p className="text-[12px]" style={{ color: "var(--t3)" }}>
                        No automations configured yet.
                    </p>
                ) : (
                    automations.slice(0, 5).map((automation) => (
                        <div
                            key={automation._id}
                            className="rounded-xl p-3 flex items-center gap-3"
                            style={{
                                background: "var(--bg)",
                                border: "1px solid var(--bd)",
                            }}
                        >
                            <div className="min-w-0 flex-1">
                                <p
                                    className="text-[13px] font-semibold truncate"
                                    style={{ color: "var(--t1)" }}
                                >
                                    {automation.name}
                                </p>
                                <p
                                    className="text-[11px]"
                                    style={{ color: "var(--t3)" }}
                                >
                                    {automation.trigger
                                        .replace(/_/g, " ")
                                        .toLowerCase()}{" "}
                                    · {automation.delayHours}h delay
                                </p>
                            </div>
                            <button
                                onClick={() => onToggle(automation)}
                                className="h-7 px-3 rounded-lg text-[11px] font-bold"
                                style={{
                                    background: automation.isActive
                                        ? "rgba(37,211,102,.12)"
                                        : "var(--white)",
                                    color: automation.isActive
                                        ? "#16a34a"
                                        : "var(--t3)",
                                    border: "1px solid var(--bd)",
                                }}
                            >
                                {automation.isActive ? "On" : "Off"}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

export default function WhatsAppPage() {
    const { lang } = useDashPrefs();
    const {
        selectedCommunityId,
        selectedCommunity,
        isLoading: communityLoading,
    } = useCreatorCommunity();
    const communityId = selectedCommunityId || getId(selectedCommunity);
    const sessionState = useWhatsappSession(communityId || null);
    const page = useWhatsappPage(communityId || null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [previewCampaign, setPreviewCampaign] =
        useState<WhatsappCampaign | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const connected = sessionState.session?.status === "ready";
    const loaded = !communityLoading && !page.loading;
    const campaigns = page.campaigns;

    const kpis = useMemo(
        () => [
            {
                label: "Messages sent",
                value: page.stats.sent.toLocaleString(),
                sub: `${page.stats.campaigns} campaigns`,
                icon: <Send className="w-5 h-5" />,
                color: "#25d366",
            },
            {
                label: "Delivery rate",
                value: `${pct(page.stats.delivered, page.stats.sent)}%`,
                sub: `${page.stats.delivered} delivered`,
                icon: <CheckCheck className="w-5 h-5" />,
                color: "var(--p)",
            },
            {
                label: "Read rate",
                value: `${pct(page.stats.read, page.stats.sent)}%`,
                sub: `${page.stats.read} read`,
                icon: <Eye className="w-5 h-5" />,
                color: "var(--cyan)",
            },
            {
                label: "Replies",
                value: page.stats.replied.toLocaleString(),
                sub: `${page.stats.remainingQuota} quota left`,
                icon: <Users className="w-5 h-5" />,
                color: "var(--orange)",
            },
        ],
        [page.stats],
    );

    const runAction = async (fn: () => Promise<void>) => {
        setActionError(null);
        try {
            await fn();
        } catch (e: any) {
            setActionError(e?.message || "Action failed");
        }
    };

    return (
        <>
            <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

            {previewCampaign && (
                <>
                    <div
                        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
                        onClick={() => setPreviewCampaign(null)}
                    />
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-[380px]">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <p className="text-[12px] font-semibold text-white">
                                    {previewCampaign.title}
                                </p>
                                <button
                                    onClick={() => setPreviewCampaign(null)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: "rgba(255,255,255,.15)",
                                        color: "#fff",
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <WaPreview body={previewCampaign.body} />
                        </div>
                    </div>
                </>
            )}

            <div
                className="flex min-h-screen"
                style={{ background: "var(--bg)" }}
            >
                <DashSidebar />
                <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
                    <DashTopbar
                        title={
                            lang === "ar" ? "WhatsApp" : "WhatsApp Campaigns"
                        }
                        subtitle={
                            selectedCommunity?.name
                                ? `Community: ${selectedCommunity.name}`
                                : "Connect, segment, and send WhatsApp broadcasts"
                        }
                    />
                    <main
                        id="main-content"
                        className="p-7 flex-1"
                        style={{ animation: "dashFadeUp .4s ease both" }}
                    >
                        {!communityId ? (
                            <div
                                className="rounded-xl p-8 text-center"
                                style={{
                                    background: "var(--white)",
                                    border: "1px solid var(--bd)",
                                }}
                            >
                                <p
                                    className="text-[15px] font-bold"
                                    style={{ color: "var(--t1)" }}
                                >
                                    Select a community first
                                </p>
                                <p
                                    className="text-[13px] mt-1"
                                    style={{ color: "var(--t3)" }}
                                >
                                    WhatsApp campaigns are scoped to one
                                    community.
                                </p>
                            </div>
                        ) : (
                            <>
                                <ConnectionPanel
                                    session={sessionState.session}
                                    health={sessionState.health}
                                    qrCodeData={sessionState.qrCodeData}
                                    pairingCode={sessionState.pairingCode}
                                    loading={sessionState.loading}
                                    error={sessionState.error}
                                    onStart={() =>
                                        runAction(sessionState.start)
                                    }
                                    onRequestPairingCode={(phone) =>
                                        runAction(async () => {
                                            await sessionState.requestPairingCode(
                                                phone,
                                            );
                                        })
                                    }
                                    onDisconnect={() =>
                                        runAction(sessionState.disconnect)
                                    }
                                    onRefreshQr={() =>
                                        runAction(async () => {
                                            await sessionState.refreshQr();
                                        })
                                    }
                                />

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
                                    {kpis.map((item) => (
                                        <KpiCard key={item.label} {...item} />
                                    ))}
                                </div>

                                {(page.error || actionError) && (
                                    <div
                                        className="rounded-xl p-3 mb-5 flex items-center gap-2"
                                        style={{
                                            background: "rgba(239,68,68,.08)",
                                            color: "#dc2626",
                                            border: "1px solid rgba(239,68,68,.25)",
                                        }}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        <p className="text-[13px]">
                                            {page.error || actionError}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <button
                                                onClick={() =>
                                                    setDrawerOpen(true)
                                                }
                                                disabled={!connected}
                                                className="h-9 px-4 rounded-xl text-[12px] font-bold text-white flex items-center gap-2 disabled:opacity-40"
                                                style={{
                                                    background: "#25d366",
                                                }}
                                            >
                                                <Plus className="w-4 h-4" /> New
                                                campaign
                                            </button>
                                            <button
                                                onClick={() => page.load()}
                                                className="h-9 w-9 rounded-xl flex items-center justify-center"
                                                style={{
                                                    background: "var(--white)",
                                                    border: "1px solid var(--bd)",
                                                    color: "var(--t2)",
                                                }}
                                                aria-label="Refresh"
                                            >
                                                <RefreshCcw className="w-4 h-4" />
                                            </button>
                                            {!connected && (
                                                <p
                                                    className="text-[12px]"
                                                    style={{
                                                        color: "var(--t3)",
                                                    }}
                                                >
                                                    Connect WhatsApp to unlock
                                                    sending.
                                                </p>
                                            )}
                                        </div>

                                        {!loaded ? (
                                            <div className="flex items-center justify-center py-24">
                                                <Loader2
                                                    className="w-8 h-8 animate-spin"
                                                    style={{ color: "#25d366" }}
                                                />
                                            </div>
                                        ) : campaigns.length === 0 ? (
                                            <div
                                                className="flex flex-col items-center justify-center py-24 rounded-xl border-2 border-dashed"
                                                style={{
                                                    borderColor: "var(--bd)",
                                                    background: "var(--white)",
                                                }}
                                            >
                                                <Inbox
                                                    className="w-10 h-10 mb-3"
                                                    style={{ color: "#25d366" }}
                                                />
                                                <p
                                                    className="text-[15px] font-bold"
                                                    style={{
                                                        color: "var(--t1)",
                                                    }}
                                                >
                                                    No campaigns yet
                                                </p>
                                                <p
                                                    className="text-[13px] mt-1"
                                                    style={{
                                                        color: "var(--t3)",
                                                    }}
                                                >
                                                    Create your first opted-in
                                                    WhatsApp broadcast.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-3">
                                                {campaigns.map((campaign) => (
                                                    <CampaignRow
                                                        key={campaign._id}
                                                        campaign={campaign}
                                                        onPreview={
                                                            setPreviewCampaign
                                                        }
                                                        onSend={(id) => {
                                                            const selectedCampaign =
                                                                campaigns.find(
                                                                    (item) =>
                                                                        item._id ===
                                                                        id,
                                                                );
                                                            const confirmed =
                                                                window.confirm(
                                                                    `Send this WhatsApp campaign to ${selectedCampaign?.totalRecipients ?? 0} recipients?\n\nOnly opted-in contacts will be sent. Reply STOP opt-out is appended automatically.`,
                                                                );
                                                            if (confirmed) {
                                                                runAction(() =>
                                                                    page.sendCampaign(
                                                                        id,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                        onCancel={(id) =>
                                                            runAction(() =>
                                                                page.cancelCampaign(
                                                                    id,
                                                                ),
                                                            )
                                                        }
                                                        onDelete={(id) =>
                                                            runAction(() =>
                                                                page.deleteCampaign(
                                                                    id,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    <aside className="grid gap-4 content-start">
                                        <ContactImporter
                                            onImport={page.importContact}
                                        />
                                        <AutomationPanel
                                            automations={page.automations}
                                            onCreate={page.createAutomation}
                                            onToggle={page.toggleAutomation}
                                        />
                                        <section
                                            className="rounded-xl p-4"
                                            style={{
                                                background: "var(--white)",
                                                border: "1px solid var(--bd)",
                                            }}
                                        >
                                            <p
                                                className="text-[13px] font-bold mb-3"
                                                style={{ color: "var(--t1)" }}
                                            >
                                                Opted-in contacts
                                            </p>
                                            <div className="grid gap-2 max-h-[300px] overflow-auto">
                                                {page.eligibleContacts
                                                    .length === 0 ? (
                                                    <p
                                                        className="text-[12px]"
                                                        style={{
                                                            color: "var(--t3)",
                                                        }}
                                                    >
                                                        Import contacts with
                                                        consent before sending.
                                                    </p>
                                                ) : (
                                                    page.eligibleContacts
                                                        .slice(0, 12)
                                                        .map((contact) => (
                                                            <div
                                                                key={
                                                                    contact._id
                                                                }
                                                                className="rounded-xl p-3"
                                                                style={{
                                                                    background:
                                                                        "var(--bg)",
                                                                    border: "1px solid var(--bd)",
                                                                }}
                                                            >
                                                                <p
                                                                    className="text-[13px] font-semibold"
                                                                    style={{
                                                                        color: "var(--t1)",
                                                                    }}
                                                                >
                                                                    {
                                                                        contact.name
                                                                    }
                                                                </p>
                                                                <p
                                                                    className="text-[12px]"
                                                                    style={{
                                                                        color: "var(--t3)",
                                                                    }}
                                                                >
                                                                    {
                                                                        contact.phoneE164
                                                                    }
                                                                </p>
                                                            </div>
                                                        ))
                                                )}
                                            </div>
                                        </section>
                                    </aside>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>

            <CampaignComposer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onCreate={page.createCampaign}
                onPreview={page.previewAudience}
                communityId={communityId || undefined}
            />
        </>
    );
}
