import type { CreatorModuleViewModel } from "@/lib/view-models/creator-module-view-model"
import { launchIcons } from "@/components/icons/launch-icons"

describe("CreatorModuleViewModel", () => {
  it("accepts launch icons and list items for shared module pages", () => {
    const model: CreatorModuleViewModel = {
      title: "Courses",
      description: "Manage structured learning.",
      primaryAction: {
        label: "New course",
        href: "/creator/courses/new",
        icon: launchIcons.course,
      },
      metrics: [
        {
          title: "Published",
          value: 2,
          icon: launchIcons.success,
          color: "success",
        },
      ],
      emptyState: {
        module: "courses",
      },
      items: [
        {
          id: "course-1",
          type: "course",
          title: "Motion basics",
          href: "/creator/courses/course-1/manage",
          status: "published",
        },
      ],
    }

    expect(model.primaryAction?.icon).toBe(launchIcons.course)
    expect(model.items?.[0]?.status).toBe("published")
  })
})
