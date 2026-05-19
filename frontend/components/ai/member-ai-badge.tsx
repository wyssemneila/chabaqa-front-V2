import { Badge } from "@/components/ui/badge";

export function MemberAiBadge() {
  return (
    <Badge variant="secondary" className="rounded-md border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
      AI · Review before publish
    </Badge>
  );
}
