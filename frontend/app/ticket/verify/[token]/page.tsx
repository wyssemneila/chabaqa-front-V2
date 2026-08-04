import { Metadata } from "next";
import { TicketVerifyClient } from "./ticket-verify-client";
import { noIndexRobots } from "@/lib/seo-config";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Ticket Verification",
    description: "Verify the authenticity and status of a Chabaqa event ticket.",
    robots: noIndexRobots,
  };
}

export default async function TicketVerifyPage({ params }: PageProps) {
  const { token } = await params;
  return <TicketVerifyClient token={token} />;
}
