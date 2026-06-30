export const siteData = {
  brand: {
    name: "Chabaqa",
  },
  
  // Color system for features
  featureColors: {
    community: {
      iconBg: '#ede9ff',
      iconBorder: '#c4b8fd',
      iconColor: '#8e78fb',
      gradient: 'from-blue-50 to-indigo-50',
    },
    course: {
      iconBg: '#fff3e4',
      iconBorder: '#fde5bb',
      iconColor: '#ff9b28',
      gradient: 'from-orange-50 to-yellow-50',
    },
    challenge: {
      iconBg: '#e4f8fd',
      iconBorder: '#a5f3fc',
      iconColor: '#47c7ea',
      gradient: 'from-cyan-50 to-blue-50',
    },
    product: {
      iconBg: '#ffe4ee',
      iconBorder: '#fda4af',
      iconColor: '#f65887',
      gradient: 'from-pink-50 to-rose-50',
    },
    event: {
      iconBg: '#ede9ff',
      iconBorder: '#c4b8fd',
      iconColor: '#8e78fb',
      gradient: 'from-indigo-50 to-purple-50',
    },
    oneToOne: {
      iconBg: '#fff3e4',
      iconBorder: '#fde5bb',
      iconColor: '#ff9b28',
      gradient: 'from-amber-50 to-orange-50',
    },
    dms: {
      iconBg: '#d1fae5',
      iconBorder: '#6ee7b7',
      iconColor: '#10b981',
      gradient: 'from-green-50 to-emerald-50',
    },
    analytics: {
      iconBg: '#ccfbf1',
      iconBorder: '#5eead4',
      iconColor: '#14b8a6',
      gradient: 'from-teal-50 to-cyan-50',
    },
    branding: {
      iconBg: '#fef3c7',
      iconBorder: '#fcd34d',
      iconColor: '#f59e0b',
      gradient: 'from-amber-50 to-yellow-50',
    },
  },
  
  navigationGroups: [
    {
      title: "Main",
      items: [
        { name: "Explore", href: "/explore" },
        { name: "Pricing", href: "/#pricing" },
        { name: "About", href: "/#about" },
        { name: "Features", href: "/#features" },
      ],
    },
  ],

  hero: {
    title: "Turn your passion into business",
    subtitle:
      "Create, engage, and monetize your audience with the platform designed for creators who want to build something amazing.",
    cta: {
      primary: "Start Building Free",
      secondary: "See Success Stories",
    },
  },
  
  features: [
    {
      id: "community",
      title: "Community",
      description:
        "Customize your spaces, prompt discussions, host live events, and launch your course. Circle is built for member engagement from the ground up.",
      buttonText: "Join Community",
      video: "/features-vds/communt.mp4",
      url: "chabaqa.io/community",
      color: "community",
      badgeColor: "border-blue-500/50 text-blue-600 bg-blue-50",
      ctaGradient: "from-[#5d67ff] to-[#8e78fb]",
      bgGradient: "from-blue-50 to-indigo-50",
      badges: [
        {
          id: "discussions",
          label: "Discussions",
          features: [
            "Built for engagement",
            "Personalized feed",
            "Posts and comments with rich media",
            "Automated moderation",
            "Search with unlimited history",
          ],
          testimonial: {
            quote:
              "Circle has hosted two communities I've built. Each time, it's been important for the community to have flexibility, the ability to be customized, and create a seamless member experience.",
            author: "Reina Pomeroy",
            title: "Sr. Director of Community",
          },
          image: "/community-discussion-interface-with-posts-and-comm.jpg",
        },
        {
          id: "messaging",
          label: "Messaging",
          features: [
            "Direct messaging",
            "Group conversations",
            "File sharing",
            "Message reactions",
            "Thread organization",
          ],
          testimonial: {
            quote: "The messaging system has transformed how our members connect and collaborate on projects.",
            author: "Sarah Johnson",
            title: "Community Manager",
          },
          image: "/messaging-interface-with-chat-conversations.jpg",
        },
        {
          id: "courses",
          label: "Courses",
          features: [
            "Course creation tools",
            "Progress tracking",
            "Interactive assignments",
            "Certificates",
            "Student analytics",
          ],
          testimonial: {
            quote: "Creating and managing courses has never been easier. The engagement metrics are incredible.",
            author: "Mike Chen",
            title: "Course Creator",
          },
          image: "/online-course-interface-with-lessons-and-progress.jpg",
        },
        {
          id: "events",
          label: "Events",
          features: [
            "Event scheduling",
            "RSVP management",
            "Calendar integration",
            "Reminder notifications",
            "Attendance tracking",
          ],
          testimonial: {
            quote: "Our event attendance has increased by 300% since using the integrated event system.",
            author: "Lisa Park",
            title: "Event Coordinator",
          },
          image: "/event-management-interface-with-calendar-and-rsvps.jpg",
        },
        {
          id: "live-streams",
          label: "Live streams",
          features: [
            "HD streaming",
            "Interactive chat",
            "Screen sharing",
            "Recording capabilities",
            "Multi-presenter support",
          ],
          testimonial: {
            quote:
              "The live streaming quality and engagement features have made our virtual events feel truly interactive.",
            author: "David Kim",
            title: "Content Creator",
          },
          image: "/live-streaming-interface-with-video-and-chat.jpg",
        },
        {
          id: "directory",
          label: "Directory",
          features: [
            "Member profiles",
            "Search and filters",
            "Contact information",
            "Skill matching",
            "Networking tools",
          ],
          testimonial: {
            quote: "The member directory has become the backbone of our professional networking community.",
            author: "Emma Wilson",
            title: "Network Administrator",
          },
          image: "/member-directory-interface-with-profiles-and-searc.jpg",
        },
        {
          id: "customization",
          label: "Customization",
          features: [
            "Brand customization",
            "Theme options",
            "Custom domains",
            "White-label solutions",
            "API integrations",
          ],
          testimonial: {
            quote: "The customization options allowed us to create a community that perfectly matches our brand.",
            author: "Alex Rodriguez",
            title: "Brand Manager",
          },
          image: "/customization-interface-with-branding-and-theme-op.jpg",
        },
        {
          id: "gamification",
          label: "Gamification",
          features: ["Points and badges", "Leaderboards", "Achievement system", "Rewards program", "Progress tracking"],
          testimonial: {
            quote: "Gamification has increased member engagement by 250% in our community.",
            author: "Jordan Taylor",
            title: "Engagement Specialist",
          },
          image: "/gamification-interface-with-badges-and-leaderboard.jpg",
        },
        {
          id: "analytics",
          label: "Analytics",
          features: [
            "Engagement metrics",
            "Member insights",
            "Content performance",
            "Growth tracking",
            "Custom reports",
          ],
          testimonial: {
            quote: "The analytics dashboard gives us incredible insights into our community's health and growth.",
            author: "Taylor Morgan",
            title: "Data Analyst",
          },
          image: "/analytics-dashboard.png",
        },
      ],
      href: "/#community",
    },
    {
      id: "course",
      title: "Online Courses",
      description:
        "Create, manage, and deliver engaging online courses with interactive content, progress tracking, and comprehensive analytics to maximize learning outcomes.",
      buttonText: "Start Learning",
      video: "/features-vds/course.mp4",
      url: "chabaqa.io/courses",
      color: "course",
      badgeColor: "border-[#47c7ea]/50 text-[#47c7ea] bg-[#47c7ea]/10",
      ctaGradient: "from-[#47c7ea] to-[#86e4fd]",
      bgGradient: "from-cyan-50 to-blue-50",
      badges: [
        {
          id: "lessons",
          label: "Lessons",
          features: [
            "Interactive video content",
            "Downloadable resources",
            "Quiz integration",
            "Progress tracking",
            "Mobile-friendly player",
          ],
          testimonial: {
            quote:
              "The lesson structure and interactive elements have transformed how our students engage with content.",
            author: "Dr. Sarah Mitchell",
            title: "Educational Director",
          },
          image: "/online-course-interface-with-lessons-and-progress.jpg",
        },
        {
          id: "assignments",
          label: "Assignments",
          features: [
            "Custom assignment builder",
            "Automated grading",
            "Peer review system",
            "Deadline management",
            "Feedback tools",
          ],
          testimonial: {
            quote: "Assignment management has become seamless, saving us hours of administrative work.",
            author: "Prof. Michael Chen",
            title: "Course Instructor",
          },
          image: "/assignment-interface-with-grading-and-feedback.jpg",
        },
        {
          id: "certificates",
          label: "Certificates",
          features: [
            "Custom certificate design",
            "Automated issuance",
            "Digital verification",
            "Blockchain security",
            "Social sharing",
          ],
          testimonial: {
            quote: "Our students love the professional certificates they receive upon course completion.",
            author: "Lisa Rodriguez",
            title: "Training Manager",
          },
          image: "/certificate-interface-with-custom-design.jpg",
        },
      ],
      href: "/#courses",
    },
    {
      id: "challenge",
      title: "Challenges & Competitions",
      description:
        "Engage your community with exciting challenges, competitions, and skill-building activities that drive participation and foster healthy competition.",
      buttonText: "Join Challenge",
      video: "/features-vds/challenge.mp4",
      url: "chabaqa.io/challenges",
      color: "challenge",
      badgeColor: "border-[#ff9b28]/50 text-[#ff9b28] bg-[#ff9b28]/10",
      ctaGradient: "from-[#ff9b28] to-[#fddab0]",
      bgGradient: "from-orange-50 to-yellow-50",
      badges: [
        {
          id: "competitions",
          label: "Competitions",
          features: [
            "Real-time leaderboards",
            "Team competitions",
            "Prize management",
            "Automated scoring",
            "Performance analytics",
          ],
          testimonial: {
            quote: "Our monthly competitions have increased community engagement by 400%.",
            author: "Jake Thompson",
            title: "Community Lead",
          },
          image: "/competition-interface-with-teams-and-scoring.jpg",
        },
        {
          id: "skill-challenges",
          label: "Skill Challenges",
          features: [
            "Progressive difficulty",
            "Skill assessment",
            "Achievement badges",
            "Mentor matching",
            "Resource library",
          ],
          testimonial: {
            quote: "The skill challenges have helped our members develop expertise in a structured way.",
            author: "Maria Santos",
            title: "Skills Development Manager",
          },
          image: "/skill-challenge-interface-with-progress.jpg",
        },
      ],
      href: "/#challenges",
    },
    {
      id: "product",
      title: "Product Marketplace",
      description:
        "Showcase and sell your products with integrated e-commerce features, inventory management, and seamless payment processing.",
      buttonText: "Browse Products",
      video: "/features-vds/product.mp4",
      url: "chabaqa.io/products",
      color: "product",
      badgeColor: "border-purple-500/50 text-purple-600 bg-purple-50",
      ctaGradient: "from-[#5d67ff] to-[#86e4fd]",
      bgGradient: "from-purple-50 to-indigo-50",
      badges: [
        {
          id: "catalog",
          label: "Product Catalog",
          features: [
            "Rich product galleries",
            "Advanced search filters",
            "Category organization",
            "Inventory tracking",
            "Bulk import tools",
          ],
          testimonial: {
            quote: "Managing our product catalog has never been easier with the intuitive interface.",
            author: "Emma Wilson",
            title: "E-commerce Manager",
          },
          image: "/product-catalog-interface-with-filters.jpg",
        },
        {
          id: "payments",
          label: "Payments",
          features: [
            "Multiple payment gateways",
            "Subscription billing",
            "Tax calculation",
            "Refund management",
            "Financial reporting",
          ],
          testimonial: {
            quote: "The integrated payment system has streamlined our entire sales process.",
            author: "David Kim",
            title: "Sales Director",
          },
          image: "/payment-interface-with-checkout.jpg",
        },
      ],
      href: "/#products",
    },
    {
      id: "oneToOne",
      title: "1-on-1 Coaching",
      description:
        "Connect with mentors and coaches through personalized one-on-one sessions with scheduling, video calls, and progress tracking.",
      buttonText: "Book Session",
      video: "/features-vds/session.mp4",
      url: "chabaqa.io/sessions",
      color: "oneToOne",
      badgeColor: "border-[#f65887]/50 text-[#f65887] bg-[#f65887]/10",
      ctaGradient: "from-[#f65887] to-[#fddab0]",
      bgGradient: "from-pink-50 to-rose-50",
      badges: [
        {
          id: "scheduling",
          label: "Scheduling",
          features: [
            "Calendar integration",
            "Automated booking",
            "Time zone handling",
            "Reminder notifications",
            "Rescheduling tools",
          ],
          testimonial: {
            quote: "The scheduling system has eliminated all the back-and-forth emails with clients.",
            author: "Rachel Green",
            title: "Life Coach",
          },
          image: "/scheduling-interface-with-calendar-booking.jpg",
        },
        {
          id: "video-calls",
          label: "Video Calls",
          features: ["HD video quality", "Screen sharing", "Session recording", "Chat integration", "Breakout rooms"],
          testimonial: {
            quote: "The video call quality and features rival any professional platform.",
            author: "Dr. James Wilson",
            title: "Business Coach",
          },
          image: "/video-call-interface-with-screen-sharing.jpg",
        },
      ],
      href: "/#coaching",
    },
    {
      id: "dms",
      title: "Direct Messages",
      description:
        "Connect privately with members through secure direct messaging. Share files, create group chats, and build meaningful one-on-one relationships.",
      buttonText: "Start Messaging",
      video: "/features-vds/dms.mp4",
      url: "chabaqa.io/messages",
      color: "dms",
      badgeColor: "border-green-500/50 text-green-600 bg-green-50",
      ctaGradient: "from-[#10b981] to-[#34d399]",
      bgGradient: "from-green-50 to-emerald-50",
      badges: [
        {
          id: "private-chat",
          label: "Private Chat",
          features: [
            "One-on-one messaging",
            "Real-time notifications",
            "Message history",
            "Read receipts",
            "Typing indicators",
          ],
          testimonial: {
            quote: "Direct messaging has made member connections more personal and meaningful.",
            author: "Sophie Anderson",
            title: "Community Manager",
          },
          image: "/messaging-interface-with-chat-conversations.jpg",
        },
        {
          id: "group-chat",
          label: "Group Chat",
          features: [
            "Create group conversations",
            "Add/remove members",
            "Group naming",
            "Shared media gallery",
            "Mention notifications",
          ],
          testimonial: {
            quote: "Group chats have enabled our members to collaborate on projects seamlessly.",
            author: "Ryan Martinez",
            title: "Project Lead",
          },
          image: "/group-chat-interface.jpg",
        },
        {
          id: "file-sharing",
          label: "File Sharing",
          features: [
            "Share documents",
            "Image and video support",
            "File preview",
            "Download management",
            "Storage tracking",
          ],
          testimonial: {
            quote: "Sharing resources through DMs has streamlined our workflow significantly.",
            author: "Nina Patel",
            title: "Content Creator",
          },
          image: "/file-sharing-interface.jpg",
        },
      ],
      href: "/#dms",
    },
    {
      id: "analytics",
      title: "Analytics & Insights",
      description:
        "Track your community's growth, engagement, and revenue with comprehensive analytics. Make data-driven decisions to optimize your community.",
      buttonText: "View Analytics",
      video: "/features-vds/analytics.mp4",
      url: "chabaqa.io/analytics",
      color: "analytics",
      badgeColor: "border-teal-500/50 text-teal-600 bg-teal-50",
      ctaGradient: "from-[#14b8a6] to-[#2dd4bf]",
      bgGradient: "from-teal-50 to-cyan-50",
      badges: [
        {
          id: "engagement-metrics",
          label: "Engagement Metrics",
          features: [
            "Active user tracking",
            "Content performance",
            "Interaction rates",
            "Peak activity times",
            "Member retention",
          ],
          testimonial: {
            quote: "The engagement metrics help us understand what content resonates with our community.",
            author: "Chris Johnson",
            title: "Analytics Manager",
          },
          image: "/analytics-dashboard.png",
        },
        {
          id: "revenue-tracking",
          label: "Revenue Tracking",
          features: [
            "Sales analytics",
            "Subscription metrics",
            "Revenue forecasting",
            "Payment trends",
            "Financial reports",
          ],
          testimonial: {
            quote: "Revenue tracking has given us clear visibility into our business performance.",
            author: "Amanda Lee",
            title: "Finance Director",
          },
          image: "/revenue-dashboard.jpg",
        },
        {
          id: "growth-insights",
          label: "Growth Insights",
          features: [
            "Member growth trends",
            "Acquisition channels",
            "Conversion rates",
            "Churn analysis",
            "Predictive analytics",
          ],
          testimonial: {
            quote: "Growth insights have helped us double our community size in just 6 months.",
            author: "Mark Thompson",
            title: "Growth Lead",
          },
          image: "/growth-analytics.jpg",
        },
      ],
      href: "/#analytics",
    },
    {
      id: "branding",
      title: "Branding & Customization",
      description:
        "Create a unique brand experience with custom themes, logos, colors, and domains. Make your community truly yours with white-label solutions.",
      buttonText: "Customize Brand",
      video: "/features-vds/branding.mp4",
      url: "chabaqa.io/branding",
      color: "branding",
      badgeColor: "border-amber-500/50 text-amber-600 bg-amber-50",
      ctaGradient: "from-[#f59e0b] to-[#fbbf24]",
      bgGradient: "from-amber-50 to-yellow-50",
      badges: [
        {
          id: "custom-themes",
          label: "Custom Themes",
          features: [
            "Color customization",
            "Font selection",
            "Layout options",
            "Dark mode support",
            "Mobile responsive",
          ],
          testimonial: {
            quote: "The theming options allowed us to create a community that perfectly matches our brand identity.",
            author: "Jessica Brown",
            title: "Brand Designer",
          },
          image: "/customization-interface-with-branding-and-theme-op.jpg",
        },
        {
          id: "white-label",
          label: "White Label",
          features: [
            "Custom domain",
            "Remove platform branding",
            "Custom email templates",
            "Branded mobile apps",
            "API access",
          ],
          testimonial: {
            quote: "White-label features gave us complete control over our brand presentation.",
            author: "Michael Foster",
            title: "CEO",
          },
          image: "/white-label-interface.jpg",
        },
        {
          id: "brand-assets",
          label: "Brand Assets",
          features: [
            "Logo upload",
            "Favicon customization",
            "Social media images",
            "Email signatures",
            "Asset library",
          ],
          testimonial: {
            quote: "Managing all our brand assets in one place has streamlined our workflow.",
            author: "Olivia Martinez",
            title: "Marketing Director",
          },
          image: "/brand-assets-interface.jpg",
        },
      ],
      href: "/#branding",
    },
    {
      id: "event",
      title: "Live Events",
      description:
        "Host engaging live events, webinars, and workshops with interactive features, attendee management, and comprehensive analytics.",
      buttonText: "Attend Event",
      video: "/features-vds/event.mp4",
      url: "chabaqa.io/events",
      color: "event",
      badgeColor: "border-indigo-500/50 text-indigo-600 bg-indigo-50",
      ctaGradient: "from-[#8e78fb] to-[#86e4fd]",
      bgGradient: "from-indigo-50 to-purple-50",
      badges: [
        {
          id: "webinars",
          label: "Webinars",
          features: [
            "Interactive presentations",
            "Q&A sessions",
            "Polls and surveys",
            "Breakout rooms",
            "Recording capabilities",
          ],
          testimonial: {
            quote: "Our webinar attendance and engagement rates have doubled since switching platforms.",
            author: "Alex Rodriguez",
            title: "Marketing Director",
          },
          image: "/webinar-interface-with-qa-and-polls.jpg",
        },
        {
          id: "workshops",
          label: "Workshops",
          features: [
            "Hands-on activities",
            "Group collaboration",
            "Resource sharing",
            "Progress tracking",
            "Certificate issuance",
          ],
          testimonial: {
            quote: "The workshop tools have made our training sessions more interactive and effective.",
            author: "Taylor Morgan",
            title: "Training Specialist",
          },
          image: "/workshop-interface-with-collaboration.jpg",
        },
      ],
      href: "/#events",
    },
  ],
  successStories: [
    {
      name: "Mohamed Ali",
      role: "Fitness Coach",
      community: "FitLife Community",
      members: "2,500+",
      revenue: "$15K/month",
      story:
        "Built a thriving fitness community that generates consistent revenue through workout programs and nutrition coaching.",
      image: "/succes-story-cover/mohamed-ali.png?height=300&width=400",
      results: ["300% increase in client retention", "5x revenue growth", "24/7 community engagement"],
    },
    {
      name: "Sameh Jlassi",
      role: "Language Teacher",
      community: "Spanish Mastery Hub",
      members: "1,800+",
      revenue: "$8K/month",
      story: "Created an immersive Spanish learning community with live conversation sessions and cultural events.",
      image: "/succes-story-cover/sameh-jlassi.png?height=300&width=400",
      results: ["95% course completion rate", "4.9/5 student satisfaction", "International student base"],
    },
    {
      name: "Ahmed Karim",
      role: "Tech Educator",
      community: "Code Academy Pro",
      members: "3,200+",
      revenue: "$22K/month",
      story: "Transformed coding education with hands-on projects, mentorship programs, and career guidance.",
      image: "/succes-story-cover/yassine-aniba-ken-je-massri.png?height=300&width=400",
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
      href: "/#course",
    },
    {
      title: "Monetization Strategies for Creators",
      description: "Proven strategies to generate revenue from your community",
      type: "Article",
      readTime: "8 min read",
      category: "Monetization",
      href: "/#course",
    },
    {
      title: "Live Streaming Best Practices",
      description: "Tips and tricks for engaging live streaming sessions",
      type: "Video",
      readTime: "12 min watch",
      category: "Content Creation",
      href: "/#course",
    },
    {
      title: "Community Engagement Tactics",
      description: "Keep your community active and engaged with these proven tactics",
      type: "Webinar",
      readTime: "45 min watch",
      category: "Engagement",
      href: "/#course",
    },
  ],
  pricing: {
    title: "Choose Your Plan",
    subtitle: "Every plan includes a 7-day trial through secure checkout",
    plans: [
      {
        name: "Starter",
        tier: "Starter",
        prices: { monthly: 39, yearly: 372 },
        description: "Perfect for getting started",
        trial: "7 days",
        features: [
          "1 Community (up to 100 members)",
          "Activate up to 3 Courses",
          "Digital products enabled",
          "5 GB storage",
          "30-day analytics lookback",
          "Transaction fee: 7.9% + 0.5 TND"
        ],
        cta: "Start 7-Day Trial",
        popular: false
      },
      {
        name: "Growth",
        tier: "Growth",
        prices: { monthly: 99, yearly: 948 },
        description: "For growing communities",
        trial: "7 days",
        features: [
          "1 Community (up to 500 members)",
          "Unlimited active courses",
          "Courses, challenges, 1:1 sessions, products, and events",
          "1,000 email recipients/month and 250 WhatsApp messages/month",
          "Gamification",
          "180-day analytics lookback",
          "Verified badge",
          "50 GB Storage for Files, Videos & Resources",
          "Transaction fee: 4.9% + 0.5 TND"
        ],
        cta: "Start 7-Day Trial",
        popular: true
      },
      {
        name: "Pro",
        tier: "Pro",
        prices: { monthly: 159, yearly: 1524 },
        description: "For professional creators",
        trial: "7 days",
        features: [
          "1 Community with unlimited members",
          "Unlimited active courses",
          "Courses, challenges, 1:1 sessions, products, and events",
          "15,000 email recipients/month and 1,000 WhatsApp messages/month",
          "3 admin seats",
          "Remove Chabaqa branding",
          "Featured badge",
          "300 GB storage",
          "365-day analytics lookback",
          "Transaction fee: 2.9% + 0.5 TND"
        ],
        cta: "Start 7-Day Trial",
        popular: false
      }
    ]
  },

  about: {
    title: "What is Chabaqa ?",
    description:
      "Chabaqa enables individuals to leverage their expertise, irrespective of their background or access to traditional employment, to build sustainable careers by monetizing their knowledge. We empower creators to connect with global audiences, gain professional recognition, and generate meaningful income transforming untapped potential into tangible economic opportunities.",
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
  videos: [
    { id: 'EmuPphacf0k', num: '01', tag: 'Getting Started', dur: '3:32' },
    { id: 'sEXWWLlhuqA', num: '02', tag: 'Courses', dur: '4:15' },
    { id: 'PyHE0D9pWFU', num: '03', tag: 'Challenges', dur: '3:10' },
    { id: 'tmnUakwzMpQ', num: '04', tag: 'Coaching', dur: '2:59' },
    { id: 'Om87N_xrcfQ', num: '05', tag: 'Products', dur: '3:39' },
    { id: 'YXoqN0vRLe8', num: '06', tag: 'Events', dur: '3:06' },
  ],
  footer: {
    description: "Empowering communities worldwide to learn, connect, and thrive together.",
    links: {
      product: [
        { name: "Explore", href: "/explore" },
        { name: "All Features", href: "/#features" },
        { name: "Pricing", href: "/#pricing" },
      ],
      company: [
        { name: "About", href: "/#about" },
        { name: "Terms of Service", href: "/terms-of-service" },
        { name: "Privacy Policy", href: "/privacy-policy" },
      ],
      support: [],
    },
    social: [
      { name: "Facebook", href: "https://facebook.com/chabaqa", icon: "Facebook" },
      { name: "Instagram", href: "https://instagram.com/chabaqa", icon: "Instagram" },
      { name: "LinkedIn", href: "https://linkedin.com/company/chabaqa", icon: "Linkedin" },
    ],
  },
}
