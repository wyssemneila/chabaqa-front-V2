/**
 * Moderator Dashboard Tests
 *
 * Tests for permission gating and component rendering in the moderator dashboard.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockGetQueue = jest.fn();
const mockModeratePost = jest.fn();
const mockPinPost = jest.fn();
const mockUnpinPost = jest.fn();
const mockGetPinnedPosts = jest.fn();
const mockDeleteComment = jest.fn();
const mockGetActivityLog = jest.fn();
const mockGetStats = jest.fn();

jest.mock("@/lib/api/moderation.api", () => ({
  moderationApi: {
    getQueue: (...args: any[]) => mockGetQueue(...args),
    moderatePost: (...args: any[]) => mockModeratePost(...args),
    pinPost: (...args: any[]) => mockPinPost(...args),
    unpinPost: (...args: any[]) => mockUnpinPost(...args),
    getPinnedPosts: (...args: any[]) => mockGetPinnedPosts(...args),
    deleteComment: (...args: any[]) => mockDeleteComment(...args),
    getActivityLog: (...args: any[]) => mockGetActivityLog(...args),
    getStats: (...args: any[]) => mockGetStats(...args),
  },
}));

const mockGetMembers = jest.fn();

jest.mock("@/lib/api/communities.api", () => ({
  communitiesApi: {
    getMembers: (...args: any[]) => mockGetMembers(...args),
  },
}));

const mockUseCommunityPermissions = jest.fn();

jest.mock("@/hooks/use-community-permissions", () => ({
  useCommunityPermissions: (...args: any[]) => mockUseCommunityPermissions(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/test-community/community/dashboard/moderator",
  useParams: () => ({
    creator: "test-community",
    feature: "community",
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import { CommunityPermission, ROLE_PERMISSIONS } from "@/lib/permissions";

// ── Permission Gating Tests ────────────────────────────────────────────────

describe("Moderator Dashboard - Permission Gating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Role-based permissions", () => {
    it("should grant owner all moderator permissions", () => {
      const ownerPermissions = ROLE_PERMISSIONS.owner;
      expect(ownerPermissions).toContain(CommunityPermission.POSTS_MODERATE);
      expect(ownerPermissions).toContain(CommunityPermission.MEMBERS_VIEW);
    });

    it("should grant admin all moderator permissions", () => {
      const adminPermissions = ROLE_PERMISSIONS.admin;
      expect(adminPermissions).toContain(CommunityPermission.POSTS_MODERATE);
      expect(adminPermissions).toContain(CommunityPermission.MEMBERS_VIEW);
    });

    it("should grant moderator only moderation and view permissions", () => {
      const moderatorPermissions = ROLE_PERMISSIONS.moderator;
      expect(moderatorPermissions).toContain(CommunityPermission.POSTS_MODERATE);
      expect(moderatorPermissions).toContain(CommunityPermission.MEMBERS_VIEW);
      expect(moderatorPermissions).not.toContain(CommunityPermission.ROLES_MANAGE);
      expect(moderatorPermissions).not.toContain(CommunityPermission.MEMBERS_MANAGE);
    });

    it("should not grant member any moderation permissions", () => {
      const memberPermissions = ROLE_PERMISSIONS.member;
      expect(memberPermissions).not.toContain(CommunityPermission.POSTS_MODERATE);
    });

    it("should not grant support role moderation permissions", () => {
      const supportPermissions = ROLE_PERMISSIONS.support;
      expect(supportPermissions).not.toContain(CommunityPermission.POSTS_MODERATE);
      expect(supportPermissions).toContain(CommunityPermission.MEMBERS_VIEW);
    });
  });
});

describe("Moderator Dashboard - Permission checking", () => {
  it("owner permissions include posts.moderate", () => {
    expect(ROLE_PERMISSIONS.owner).toContain("posts.moderate");
  });

  it("moderator permissions are limited", () => {
    const modPermissions = ROLE_PERMISSIONS.moderator;
    expect(modPermissions).toContain("posts.moderate");
    expect(modPermissions).toContain("members.view");
    expect(modPermissions.length).toBe(2);
  });

  it("member has no moderator permissions", () => {
    expect(ROLE_PERMISSIONS.member.length).toBe(0);
  });
});
