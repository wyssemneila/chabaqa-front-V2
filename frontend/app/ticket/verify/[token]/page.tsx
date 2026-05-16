import { Metadata } from "next";
import { TicketVerifyClient } from "./ticket-verify-client";
import { noIndexRobots } from "@/lib/seo-config";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Verify Ticket — Chabaqa",
    description: "Verify your event ticket authenticity on Chabaqa",
    robots: noIndexRobots,
  };
}

export default async function TicketVerifyPage({ params }: PageProps) {
  const { token } = await params;
  return <TicketVerifyClient token={token} />;
}
