export class BackendService {
  private static instance: BackendService
  private storage: Map<string, any> = new Map()

  static getInstance(): BackendService {
    if (!BackendService.instance) {
      BackendService.instance = new BackendService()
    }
    return BackendService.instance
  }

  // Community Management
  async createCommunity(data: any): Promise<any> {
    const id = Date.now()
    const community = {
      id,
      slug: data.name.toLowerCase().replace(/\s+/g, "-"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }

    this.storage.set(`community_${id}`, community)
    return community
  }

  async updateCommunity(id: number, data: any): Promise<any> {
    const existing = this.storage.get(`community_${id}`)
    if (!existing) throw new Error("Community not found")

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    this.storage.set(`community_${id}`, updated)
    return updated
  }

  async getCommunity(id: number): Promise<any> {
    return this.storage.get(`community_${id}`)
  }

  async getCommunities(userId: number): Promise<any[]> {
    const communities = []
    for (const [key, value] of this.storage.entries()) {
      if (key.startsWith("community_") && value.creatorId === userId) {
        communities.push(value)
      }
    }
    return communities
  }

  // Template Management
  async getTemplates(filters?: any): Promise<any[]> {
    // Simulate template data
    return [
      {
        id: 1,
        name: "Modern Marketing",
        category: "marketing",
        style: "modern",
        config: {
          colors: { primary: "#8e78fb", secondary: "#f65887" },
          fonts: { heading: "Inter", body: "Inter" },
          layout: "centered",
          sections: ["hero", "features", "testimonials", "cta"],
        },
      },
      // More templates...
    ]
  }

  async applyTemplate(communityId: number, templateId: number): Promise<any> {
    const template = await this.getTemplate(templateId)
    const community = await this.getCommunity(communityId)

    if (!template || !community) {
      throw new Error("Template or community not found")
    }

    const updatedCommunity = {
      ...community,
      settings: {
        ...community.settings,
        ...template.config,
      },
      updatedAt: new Date().toISOString(),
    }

    this.storage.set(`community_${communityId}`, updatedCommunity)
    return updatedCommunity
  }

  async getTemplate(id: number): Promise<any> {
    // Simulate getting template by ID
    const templates = await this.getTemplates()
    return templates.find((t) => t.id === id)
  }

  // Analytics
  async getAnalytics(communityId: number, timeRange: string): Promise<any> {
    // Simulate analytics data
    return {
      members: {
        total: 5234,
        growth: 12.5,
        data: [
          { date: "2024-01-01", value: 1200 },
          { date: "2024-02-01", value: 1900 },
          { date: "2024-03-01", value: 2800 },
          { date: "2024-04-01", value: 3900 },
          { date: "2024-05-01", value: 4200 },
          { date: "2024-06-01", value: 5234 },
        ],
      },
      engagement: {
        rate: 78,
        posts: 145,
        comments: 892,
        likes: 2341,
      },
      revenue: {
        total: 152460,
        growth: 8.2,
        data: [
          { date: "2024-01-01", value: 2400 },
          { date: "2024-02-01", value: 3200 },
          { date: "2024-03-01", value: 4100 },
          { date: "2024-04-01", value: 5800 },
          { date: "2024-05-01", value: 6200 },
          { date: "2024-06-01", value: 7500 },
        ],
      },
    }
  }

  // File Upload
  async uploadFile(file: File, type: "image" | "video" | "document"): Promise<string> {
    // Simulate file upload
    return new Promise((resolve) => {
      setTimeout(() => {
        const url = `/uploads/${type}/${Date.now()}_${file.name}`
        resolve(url)
      }, 1000)
    })
  }

  // Member Management
  async getMembers(communityId: number): Promise<any[]> {
    // Simulate member data
    return [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "member",
        joinedAt: "2024-01-15",
        lastActive: "2024-06-01",
        status: "active",
      },
      // More members...
    ]
  }

  async inviteMember(communityId: number, email: string, role: string): Promise<any> {
    // Simulate member invitation
    return {
      id: Date.now(),
      email,
      role,
      status: "pending",
      invitedAt: new Date().toISOString(),
    }
  }
}

export const backendService = BackendService.getInstance()
