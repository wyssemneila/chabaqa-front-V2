import {
  canAccessAdminPath,
  getAdminLandingPath,
  requiresCapabilityGuard,
} from "@/app/(admin)/lib/admin-capability-routing";
import type { AdminCapabilities } from "@/lib/api/admin-api";

const emptyCaps: AdminCapabilities = {
  dashboard: false,
  users: false,
  communities: false,
  contentModeration: false,
  financial: false,
  analytics: false,
  security: false,
  communication: false,
  liveSupport: false,
  settings: false,
};

describe("admin capability routing", () => {
  it("picks first accessible landing route in priority order", () => {
    expect(getAdminLandingPath(emptyCaps)).toBe("/admin/dashboard");

    const caps: AdminCapabilities = {
      ...emptyCaps,
      communities: true,
      settings: true,
    };
    expect(getAdminLandingPath(caps)).toBe("/admin/communities");
  });

  it("enforces capability guards on primary admin routes", () => {
    expect(canAccessAdminPath("/admin/users", emptyCaps)).toBe(false);
    expect(canAccessAdminPath("/admin/users/abc", { ...emptyCaps, users: true })).toBe(true);
    expect(canAccessAdminPath("/admin/security/events", { ...emptyCaps, security: false })).toBe(false);
    expect(canAccessAdminPath("/admin/security/events", { ...emptyCaps, security: true })).toBe(true);
  });

  it("allows support route for live-support capability", () => {
    expect(canAccessAdminPath("/admin/communication/support", { ...emptyCaps, liveSupport: true })).toBe(true);
    expect(canAccessAdminPath("/admin/communication", { ...emptyCaps, liveSupport: true })).toBe(false);
  });

  it("applies operations guard as composite capability", () => {
    expect(canAccessAdminPath("/admin/export", emptyCaps)).toBe(false);
    expect(canAccessAdminPath("/admin/data-management", { ...emptyCaps, analytics: true })).toBe(true);
  });

  it("detects guarded vs unguarded admin paths", () => {
    expect(requiresCapabilityGuard("/admin/analytics")).toBe(true);
    expect(requiresCapabilityGuard("/admin/login")).toBe(false);
  });
});
