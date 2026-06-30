"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    whatsappApi,
    type WhatsappAutomation,
    type WhatsappAutomationTrigger,
    type WhatsappAudienceType,
    type WhatsappCampaign,
    type WhatsappContact,
    type WhatsappStats,
} from "@/lib/api/whatsapp.api";

const EMPTY_STATS: WhatsappStats = {
    campaigns: 0,
    recipients: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
    failed: 0,
    remainingQuota: 0,
};

function normalizeStats(stats?: Partial<WhatsappStats> | null): WhatsappStats {
    return {
        campaigns: Number(stats?.campaigns || 0),
        recipients: Number(stats?.recipients || 0),
        sent: Number(stats?.sent || 0),
        delivered: Number(stats?.delivered || 0),
        read: Number(stats?.read || 0),
        replied: Number(stats?.replied || 0),
        failed: Number(stats?.failed || 0),
        remainingQuota: Number(stats?.remainingQuota || 0),
    };
}

export function useWhatsappPage(communityId: string | null) {
    const [campaigns, setCampaigns] = useState<WhatsappCampaign[]>([]);
    const [automations, setAutomations] = useState<WhatsappAutomation[]>([]);
    const [contacts, setContacts] = useState<WhatsappContact[]>([]);
    const [stats, setStats] = useState<WhatsappStats>(EMPTY_STATS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!communityId) {
            setCampaigns([]);
            setAutomations([]);
            setContacts([]);
            setStats(EMPTY_STATS);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [campaignRes, contactRes, statsRes, automationRes] =
                await Promise.all([
                    whatsappApi.listCampaigns(communityId, { limit: 50 }),
                    whatsappApi.listContacts(communityId),
                    whatsappApi.getStats(communityId),
                    whatsappApi.listAutomations(communityId),
                ]);
            setCampaigns(campaignRes.campaigns || []);
            setContacts(contactRes.contacts || []);
            setStats(normalizeStats(statsRes));
            setAutomations(automationRes.automations || []);
        } catch (e: any) {
            setError(e?.message || "Failed to load WhatsApp data");
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    const createCampaign = useCallback(
        async (data: {
            title: string;
            body: string;
            messageType?: "text" | "image" | "video" | "document";
            mediaUrl?: string;
            targetAudience?: WhatsappAudienceType;
            scheduledAt?: string;
        }) => {
            if (!communityId) throw new Error("Select a community first");
            await whatsappApi.createCampaign({
                communityId,
                title: data.title,
                body: data.body,
                messageType: data.messageType || "text",
                mediaUrl: data.mediaUrl,
                targetAudience: data.targetAudience || "all_members",
                scheduledAt: data.scheduledAt,
            });
            await load();
        },
        [communityId, load],
    );

    const sendCampaign = useCallback(
        async (campaignId: string) => {
            await whatsappApi.sendCampaign(campaignId);
            await load();
        },
        [load],
    );

    const cancelCampaign = useCallback(
        async (campaignId: string) => {
            await whatsappApi.cancelCampaign(campaignId);
            await load();
        },
        [load],
    );

    const deleteCampaign = useCallback(
        async (campaignId: string) => {
            await whatsappApi.deleteCampaign(campaignId);
            await load();
        },
        [load],
    );

    const importContact = useCallback(
        async (data: {
            name: string;
            phoneE164: string;
            consentProof: string;
            consentSource?: string;
        }) => {
            if (!communityId) throw new Error("Select a community first");
            await whatsappApi.importContacts(communityId, [
                {
                    name: data.name,
                    phoneE164: data.phoneE164,
                    optIn: true,
                    consentProof: data.consentProof,
                    consentSource: data.consentSource || "manual_import",
                    consentMethod: "admin_attestation",
                },
            ]);
            await load();
        },
        [communityId, load],
    );

    const previewAudience = useCallback(
        async (targetAudience: WhatsappAudienceType = "all_members") => {
            if (!communityId) return null;
            return whatsappApi.previewAudience(communityId, targetAudience);
        },
        [communityId],
    );

    const createAutomation = useCallback(
        async (data: {
            name: string;
            trigger: WhatsappAutomationTrigger;
            delayHours?: number;
            body: string;
            isActive?: boolean;
        }) => {
            if (!communityId) throw new Error("Select a community first");
            await whatsappApi.createAutomation(communityId, data);
            await load();
        },
        [communityId, load],
    );

    const toggleAutomation = useCallback(
        async (automation: WhatsappAutomation) => {
            if (!communityId) throw new Error("Select a community first");
            await whatsappApi.updateAutomation(communityId, automation._id, {
                isActive: !automation.isActive,
            });
            await load();
        },
        [communityId, load],
    );

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!campaigns.some((campaign) => campaign.status === "sending"))
            return;
        const timer = window.setInterval(() => {
            load();
        }, 7000);
        return () => window.clearInterval(timer);
    }, [campaigns, load]);

    const eligibleContacts = useMemo(
        () =>
            contacts.filter((contact) => contact.consentStatus === "opted_in"),
        [contacts],
    );

    return {
        campaigns,
        automations,
        contacts,
        eligibleContacts,
        stats,
        loading,
        error,
        load,
        createCampaign,
        sendCampaign,
        cancelCampaign,
        deleteCampaign,
        importContact,
        previewAudience,
        createAutomation,
        toggleAutomation,
    };
}
