export const siteData = {
  brand: {
    name: "Chabaqa",
    tagline: "Build. Connect. Grow.",
    description:
      "The all-in-one platform for creators, educators, and organizations to build thriving communities with learning, live interaction, and monetization tools.",
  },
  navigation: [
    { name: "Features", href: "#features" },
    { name: "Success Stories", href: "#success-stories" },
    { name: "Creator Tools", href: "#creator-tools" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Resources", href: "#resources" },
    { name: "About", href: "#about" },
  ],
  hero: {
    title: "Build Your Dream Community",
    subtitle:
      "Create, engage, and monetize your audience with the platform designed for creators who want to build something amazing.",
    cta: {
      primary: "Start Building Free",
      secondary: "See Success Stories",
    },
  },
  features: [
    {
      title: "Community Challenges",
      description:
        "Create engaging challenges that bring your community together. Set goals, track progress, and celebrate achievements with your members. Perfect for fitness coaches, educators, and any creator looking to boost engagement through gamification.",
      image: "/placeholder.svg?height=400&width=600",
      buttonText: "Create Challenge",
      color: "secondary1", // Pink
      layout: "left", // content left, image right
    },
    {
      title: "Interactive Courses",
      description:
        "Build comprehensive learning experiences with our intuitive course builder. Upload videos, create quizzes, track student progress, and issue certificates. Transform your expertise into structured, monetizable educational content.",
      image: "/placeholder.svg?height=400&width=600",
      buttonText: "Build Course",
      color: "secondary2", // Light blue
      layout: "right", // image left, content right
    },
    {
      title: "1:1 Coaching Sessions",
      description:
        "Offer personalized coaching sessions directly through the platform. Schedule appointments, conduct video calls, share resources, and track client progress. Perfect for coaches, mentors, and consultants who want to scale their impact.",
      image: "/placeholder.svg?height=400&width=600",
      buttonText: "Start Coaching",
      color: "accent", // Orange
      layout: "left", // content left, image right
    },
  ],
  successStories: [
    {
      name: "Alex Thompson",
      role: "Fitness Coach",
      community: "FitLife Community",
      members: "2,500+",
      revenue: "$15K/month",
      story:
        "Built a thriving fitness community that generates consistent revenue through workout programs and nutrition coaching.",
      image: "/placeholder.svg?height=300&width=400",
      results: ["300% increase in client retention", "5x revenue growth", "24/7 community engagement"],
    },
    {
      name: "Maria Garcia",
      role: "Language Teacher",
      community: "Spanish Mastery Hub",
      members: "1,800+",
      revenue: "$8K/month",
      story: "Created an immersive Spanish learning community with live conversation sessions and cultural events.",
      image: "/placeholder.svg?height=300&width=400",
      results: ["95% course completion rate", "4.9/5 student satisfaction", "International student base"],
    },
    {
      name: "David Kim",
      role: "Tech Educator",
      community: "Code Academy Pro",
      members: "3,200+",
      revenue: "$22K/month",
      story: "Transformed coding education with hands-on projects, mentorship programs, and career guidance.",
      image: "/placeholder.svg?height=300&width=400",
      results: ["85% job placement rate", "500+ successful graduates", "Industry partnerships"],
    },
  ],
  creatorTools: [
    {
      category: "Content Creation",
      tools: [
        {
          name: "Course Builder",
          description: "Drag-and-drop course creation with multimedia support",
          features: ["Video hosting", "Interactive quizzes", "Progress tracking", "Certificates"],
        },
        {
          name: "Live Streaming",
          description: "Professional live streaming with interactive features",
          features: ["HD streaming", "Screen sharing", "Chat moderation", "Recording"],
        },
      ],
    },
    {
      category: "Community Management",
      tools: [
        {
          name: "Member Management",
          description: "Comprehensive member management and engagement tools",
          features: ["Member profiles", "Role management", "Engagement tracking", "Automated workflows"],
        },
        {
          name: "Event Organizer",
          description: "Plan and manage community events effortlessly",
          features: ["Event calendar", "Registration system", "Reminders", "Attendance tracking"],
        },
      ],
    },
    {
      category: "Monetization",
      tools: [
        {
          name: "Payment Processing",
          description: "Secure payment processing with multiple options",
          features: ["Subscription billing", "One-time payments", "Payment plans", "Global currencies"],
        },
        {
          name: "Analytics Dashboard",
          description: "Comprehensive insights into your community performance",
          features: ["Revenue tracking", "Member analytics", "Engagement metrics", "Growth insights"],
        },
      ],
    },
  ],
  howItWorks: [
    {
      step: "01",
      title: "Create Your Space",
      description: "Set up your branded community space with customizable themes and layouts.",
    },
    {
      step: "02",
      title: "Add Content & Events",
      description: "Upload courses, schedule live sessions, and organize community events.",
    },
    {
      step: "03",
      title: "Invite Your Audience",
      description: "Share your community link and start building your engaged member base.",
    },
    {
      step: "04",
      title: "Grow & Monetize",
      description: "Scale your community and generate revenue through various monetization options.",
    },
  ],
  testimonials: [
    {
      name: "Sarah Chen",
      role: "Online Educator",
      content:
        "Chabaqa transformed how I deliver courses and interact with my students. The engagement has increased by 300%!",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Marcus Rodriguez",
      role: "Community Manager",
      content:
        "Finally, a platform that combines everything we need. Our community growth has been phenomenal since switching to Chabaqa.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Dr. Emily Watson",
      role: "Corporate Trainer",
      content:
        "The live interaction features and analytics have revolutionized our training programs. Highly recommended!",
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ],
  resources: [
    {
      title: "Creator's Guide to Community Building",
      description: "Complete guide to building and growing your online community",
      type: "Guide",
      readTime: "15 min read",
      category: "Community Building",
    },
    {
      title: "Monetization Strategies for Creators",
      description: "Proven strategies to generate revenue from your community",
      type: "Article",
      readTime: "8 min read",
      category: "Monetization",
    },
    {
      title: "Live Streaming Best Practices",
      description: "Tips and tricks for engaging live streaming sessions",
      type: "Video",
      readTime: "12 min watch",
      category: "Content Creation",
    },
    {
      title: "Community Engagement Tactics",
      description: "Keep your community active and engaged with these proven tactics",
      type: "Webinar",
      readTime: "45 min watch",
      category: "Engagement",
    },
  ],
  pricing: {
    title: "Choose Your Plan",
    subtitle: "Start free and scale as you grow",
    plans: [
      {
        name: "Starter",
        price: "Free",
        description: "Perfect for getting started",
        features: ["Up to 100 community members", "Basic course creation", "Community discussions", "Email support"],
        cta: "Get Started Free",
        popular: false,
      },
      {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For growing communities",
        features: [
          "Up to 1,000 members",
          "Advanced course tools",
          "Live streaming",
          "Event management",
          "Analytics dashboard",
          "Priority support",
        ],
        cta: "Start Pro Trial",
        popular: true,
      },
      {
        name: "Enterprise",
        price: "Custom",
        description: "For large organizations",
        features: [
          "Unlimited members",
          "White-label solution",
          "Advanced integrations",
          "Dedicated support",
          "Custom features",
          "SLA guarantee",
        ],
        cta: "Contact Sales",
        popular: false,
      },
    ],
  },
  about: {
    title: "About Chabaqa",
    subtitle: "Empowering creators to build meaningful communities",
    description:
      "Founded by creators, for creators, Chabaqa was born from the need for a comprehensive platform that truly understands the creator economy. We believe every creator deserves the tools to build, engage, and monetize their community effectively.",
    values: [
      {
        title: "Creator-First",
        description: "Every feature is designed with creators' needs in mind",
        icon: "Heart",
      },
      {
        title: "Community-Driven",
        description: "Building connections that matter and last",
        icon: "Users",
      },
      {
        title: "Innovation",
        description: "Constantly evolving with the latest technology",
        icon: "Zap",
      },
    ],
    team: {
      title: "Meet Our Team",
      description: "A diverse group of creators, developers, and community builders",
    },
  },
  footer: {
    description: "Empowering communities worldwide to learn, connect, and thrive together.",
    links: {
      product: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "API", href: "#" },
        { name: "Integrations", href: "#" },
      ],
      company: [
        { name: "About", href: "#about" },
        { name: "Blog", href: "#resources" },
        { name: "Careers", href: "#" },
        { name: "Contact", href: "#" },
      ],
      support: [
        { name: "Help Center", href: "#" },
        { name: "Documentation", href: "#" },
        { name: "Community", href: "#" },
        { name: "Status", href: "#" },
      ],
    },
    social: [
      { name: "Twitter", href: "#", icon: "Twitter" },
      { name: "LinkedIn", href: "#", icon: "Linkedin" },
      { name: "GitHub", href: "#", icon: "Github" },
    ],
  },
}
