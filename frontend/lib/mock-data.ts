import type {
  User,
  Community,
  Course,
  CourseSection,
  CourseChapter,
  CourseEnrollment,
  CourseProgress,
  Challenge,
  ChallengeParticipant,
  Session,
  SessionBooking,
  Post,
  LandingPageConfig,
  CommunityMember,
  ChallengeTask,
  CourseResource,
  ChallengeResource,
  SessionResource,
  EventSpeaker,
  EventSession,
  Event,
  Product,
  Purchase
} from "./models"
import { communitiesData } from "@/lib/data-communities"

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "creator",
    verified: true,
    communities: [1, 2],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "member",
    verified: true,
    communities: [1, 2],
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "member",
    verified: true,
    communities: [1, 2],
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "4",
    name: "David Kim",
    email: "david@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "member",
    verified: true,
    communities: [1, 2],
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "5",
    name: "Alex Thompson",
    email: "alex@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "creator",
    verified: true,
    communities: [1, 2],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
]


// Mock Community Members
export const mockCommunityMembers: CommunityMember[] = [
  {
    id: "1",
    userId: "2",
    user: mockUsers[1],
    communityId: "1",
    community: communitiesData.communities[0],
    joinedAt: new Date("2024-02-01"),
    isActive: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "2",
    userId: "3",
    user: mockUsers[2],
    communityId: "1",
    community: communitiesData.communities[0],
    joinedAt: new Date("2024-02-10"),
    isActive: true,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "3",
    userId: "4",
    user: mockUsers[3],
    communityId: "1",
    community: communitiesData.communities[0],
    joinedAt: new Date("2024-02-15"),
    isActive: true,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "4",
    userId: "2",
    user: mockUsers[1],
    communityId: "2",
    community: communitiesData.communities[1],
    joinedAt: new Date("2024-02-05"),
    isActive: true,
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },
  {
    id: "5",
    userId: "3",
    user: mockUsers[2],
    communityId: "3",
    community: communitiesData.communities[2],
    joinedAt: new Date("2024-02-12"),
    isActive: true,
    createdAt: new Date("2024-02-12"),
    updatedAt: new Date("2024-02-12"),
  },
]

// Mock Course Resources
export const mockCourseResources: CourseResource[] = [
  {
    id: "1",
    title: "HTML5 Cheat Sheet",
    type: "pdf",
    url: "/resources/html5-cheat-sheet.pdf",
    description: "Complete HTML5 elements and attributes reference",
    order: 1,
  },
  {
    id: "2",
    title: "CSS Grid Generator",
    type: "tool",
    url: "https://cssgrid-generator.netlify.app/",
    description: "Interactive CSS Grid layout generator",
    order: 2,
  },
  {
    id: "3",
    title: "JavaScript ES6 Features",
    type: "article",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript/ECMAScript_2015_support_in_Mozilla",
    description: "Comprehensive guide to ES6 features",
    order: 3,
  },
]

// Mock Course Chapters
export const mockChapters: CourseChapter[] = [
  {
    id: "1",
    title: "Introduction to HTML",
    content:
      "Learn the basics of HTML structure and semantic elements. HTML (HyperText Markup Language) is the standard markup language for creating web pages. In this chapter, we'll cover the fundamental concepts of HTML including document structure, semantic elements, and best practices for writing clean, accessible HTML code.",
    videoUrl: "https://www.youtube.com/embed/dpw9EHDh2bM",
    duration: 10,
    sectionId: "1",
    order: 1,
    isPreview: true,
    notes:
      "Remember to use semantic HTML elements for better accessibility and SEO. Practice with the provided exercises.",
    resources: mockCourseResources.slice(0, 1),
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "2",
    title: "HTML Forms and Input Elements",
    content:
      "Master HTML forms, input types, and validation. Forms are essential for user interaction on the web. We'll explore different input types, form validation techniques, and accessibility considerations for creating user-friendly forms.",
    videoUrl: "https://www.youtube.com/embed/dpw9EHDh2bM",
    duration: 15,
    sectionId: "1",
    order: 2,
    isPreview: false,
    notes: "Focus on form validation and accessibility. Test your forms with screen readers.",
    resources: mockCourseResources.slice(0, 2),
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "3",
    title: "CSS Fundamentals",
    content:
      "Understanding CSS syntax, selectors, and properties. CSS (Cascading Style Sheets) is used to style and layout web pages. Learn about selectors, properties, values, and the cascade to create beautiful, responsive designs.",
    videoUrl: "https://www.youtube.com/embed/dpw9EHDh2bM",
    duration: 21,
    sectionId: "2",
    order: 1,
    isPreview: true,
    notes: "Practice with different CSS selectors and understand specificity rules.",
    resources: mockCourseResources.slice(1, 3),
    createdAt: new Date("2024-01-17"),
  },
  {
    id: "4",
    title: "CSS Flexbox Layout",
    content:
      "Master modern CSS layout with Flexbox. Flexbox is a powerful layout method that makes it easy to design flexible responsive layout structures without using float or positioning.",
    videoUrl: "https://www.youtube.com/embed/dpw9EHDh2bM",
    duration: 24,
    sectionId: "2",
    order: 2,
    isPreview: false,
    price: 9.99,
    notes: "Flexbox is essential for modern web layouts. Practice with the interactive exercises.",
    resources: mockCourseResources,
    createdAt: new Date("2024-01-17"),
  },
  {
    id: "5",
    title: "JavaScript Basics",
    content:
      "Introduction to JavaScript programming fundamentals. JavaScript is the programming language of the web. Learn about variables, functions, control structures, and DOM manipulation.",
    videoUrl: "https://www.youtube.com/embed/dpw9EHDh2bM",
    duration: 27,
    sectionId: "3",
    order: 1,
    isPreview: false,
    price: 14.99,
    notes: "JavaScript is the foundation of modern web development. Practice coding daily.",
    resources: mockCourseResources.slice(2, 3),
    createdAt: new Date("2024-01-18"),
  },
  {
    id: "6",
    title: "JavaScript Events and DOM",
    content:
      "Working with events and manipulating the DOM. Learn how to make your web pages interactive by handling user events and dynamically updating page content.",
    videoUrl: "https://www.youtube.com/embed/dpw9EHDh2bM",
    duration: 30,
    sectionId: "3",
    order: 2,
    isPreview: false,
    price: 14.99,
    notes: "DOM manipulation is crucial for interactive web applications. Build small projects to practice.",
    resources: mockCourseResources,
    createdAt: new Date("2024-01-18"),
  },
]

// Mock Course Sections
export const mockSections: CourseSection[] = [
  {
    id: "1",
    title: "HTML Fundamentals",
    description: "Learn the building blocks of web development",
    courseId: "1",
    order: 1,
    chapters: mockChapters.filter((c) => c.sectionId === "1"),
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "2",
    title: "CSS Styling",
    description: "Master the art of styling web pages",
    courseId: "1",
    order: 2,
    chapters: mockChapters.filter((c) => c.sectionId === "2"),
    createdAt: new Date("2024-01-17"),
  },
  {
    id: "3",
    title: "JavaScript Programming",
    description: "Add interactivity with JavaScript",
    courseId: "1",
    order: 3,
    chapters: mockChapters.filter((c) => c.sectionId === "3"),
    createdAt: new Date("2024-01-18"),
  },
]

// Mock Course Progress
export const mockProgress: CourseProgress[] = [
  {
    id: "1",
    enrollmentId: "1",
    chapterId: "1",
    chapter: mockChapters[0],
    isCompleted: true,
    watchTime: 1200,
    completedAt: new Date("2024-02-02"),
    lastAccessedAt: new Date("2024-02-02"),
  },
  {
    id: "2",
    enrollmentId: "1",
    chapterId: "2",
    chapter: mockChapters[1],
    isCompleted: false,
    watchTime: 900,
    lastAccessedAt: new Date("2024-02-03"),
  },
  {
    id: "3",
    enrollmentId: "1",
    chapterId: "3",
    chapter: mockChapters[2],
    isCompleted: true,
    watchTime: 2100,
    completedAt: new Date("2024-02-04"),
    lastAccessedAt: new Date("2024-02-04"),
  },
]

// Mock Course Enrollments
export const mockEnrollments: CourseEnrollment[] = [
  {
    id: "1",
    userId: "2",
    user: mockUsers[1],
    courseId: "1",
    course: {} as Course,
    progress: mockProgress,
    enrolledAt: new Date("2024-02-01"),
    isActive: true,
  },
]

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    description:
      "Learn HTML, CSS, JavaScript, React, and Node.js from scratch. This comprehensive course will take you from beginner to advanced web developer with hands-on projects and real-world examples.",
    thumbnail: "/placeholder.svg?height=200&width=300",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    price: 199,
    currency: "TND",
    isPublished: true,
    sections: mockSections,
    enrollments: mockEnrollments,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
    category: "Web Development",
    level: "Beginner",
    duration: "40 hours",
    learningObjectives: [
      "Build responsive websites with HTML, CSS, and JavaScript",
      "Create interactive web applications with React",
      "Understand modern web development workflows",
      "Deploy projects to production environments",
    ],
    requirements: ["Basic computer skills", "Internet connection", "No prior coding experience required"],
    notes:
      "This is a comprehensive course that covers all aspects of modern web development. Take your time with each section and practice regularly.",
    resources: mockCourseResources,
  },
  {
    id: "2",
    title: "React Mastery Course",
    description:
      "Master React hooks, context, performance optimization, and testing strategies. This free course covers React fundamentals with some premium advanced content.",
    thumbnail: "/placeholder.svg?height=200&width=300",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    price: 0,
    currency: "TND",
    isPublished: true,
    sections: [],
    enrollments: [],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    category: "Web Development",
    level: "Intermediate",
    duration: "15 hours",
    learningObjectives: [
      "Master React hooks and state management",
      "Understand component lifecycle and optimization",
      "Build scalable React applications",
      "Implement advanced React patterns",
    ],
    requirements: ["Basic JavaScript knowledge", "Understanding of HTML and CSS", "Node.js installed"],
    notes: "Focus on understanding React concepts deeply rather than rushing through the content.",
    resources: mockCourseResources.slice(0, 2),
  },
  {
    id: "3",
    title: "Advanced JavaScript Patterns",
    description:
      "Deep dive into advanced JavaScript concepts, design patterns, and modern ES6+ features for professional development.",
    thumbnail: "/placeholder.svg?height=200&width=300",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    price: 149,
    currency: "TND",
    isPublished: false,
    sections: [],
    enrollments: [],
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
    category: "Web Development",
    level: "Advanced",
    duration: "25 hours",
    learningObjectives: [
      "Master advanced JavaScript concepts",
      "Implement design patterns in JavaScript",
      "Understand asynchronous programming",
      "Optimize JavaScript performance",
    ],
    requirements: ["Solid JavaScript fundamentals", "Experience with ES6+", "Understanding of web APIs"],
    notes: "This course requires strong JavaScript fundamentals. Review basics if needed before starting.",
    resources: mockCourseResources,
  },
]

// Mock Challenge Resources
export const mockChallengeResources: ChallengeResource[] = [
  {
    id: "1",
    title: "Challenge Starter Kit",
    type: "code",
    url: "https://github.com/example/challenge-starter",
    description: "Boilerplate code and setup instructions",
    order: 1,
  },
  {
    id: "2",
    title: "Design Resources Pack",
    type: "pdf",
    url: "/resources/design-pack.pdf",
    description: "Color palettes, fonts, and design inspiration",
    order: 2,
  },
]

// Mock Challenge Tasks
export const mockChallengeTasks: ChallengeTask[] = [
  {
    id: "1",
    challengeId: "1",
    day: 1,
    title: "HTML Basics",
    description: "Create your first HTML page with semantic elements",
    deliverable: "Build a personal portfolio landing page using semantic HTML5 elements",
    isCompleted: true,
    isActive: false,
    points: 100,
    resources: [
      {
        id: "1",
        title: "HTML5 Semantic Elements Guide",
        type: "article",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element",
        description: "Complete guide to HTML5 semantic elements",
      },
      {
        id: "2",
        title: "HTML Basics Video Tutorial",
        type: "video",
        url: "https://www.youtube.com/embed/dpw9EHDh2bM",
        description: "15-minute video covering HTML fundamentals",
      },
    ],
    instructions: `
## Today's Challenge: HTML Basics

### Objective
Create a personal portfolio landing page using semantic HTML5 elements.

### Requirements
1. Use proper HTML5 document structure
2. Include semantic elements: header, nav, main, section, article, aside, footer
3. Add a navigation menu with at least 3 links
4. Create sections for: About, Skills, Projects, Contact
5. Use appropriate heading hierarchy (h1-h6)

### Deliverables
- HTML file with semantic structure
- Screenshot of your page in the browser
- Brief explanation of semantic elements used

### Tips
- Focus on structure, not styling (we'll add CSS tomorrow)
- Use meaningful class names and IDs
- Validate your HTML using W3C validator
    `,
    notes: "Take your time to understand semantic HTML. It's the foundation of accessible web development.",
  },
  {
    id: "2",
    challengeId: "1",
    day: 2,
    title: "CSS Styling",
    description: "Style your HTML with CSS and learn about flexbox",
    deliverable: "Style the portfolio page with modern CSS and flexbox layout",
    isCompleted: true,
    isActive: false,
    points: 100,
    resources: [
      {
        id: "3",
        title: "CSS Flexbox Complete Guide",
        type: "article",
        url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
        description: "Comprehensive flexbox guide with examples",
      },
      {
        id: "4",
        title: "Modern CSS Techniques",
        type: "video",
        url: "https://www.youtube.com/embed/dpw9EHDh2bM",
        description: "20-minute video on modern CSS techniques",
      },
    ],
    instructions: `
## Today's Challenge: CSS Styling

### Objective
Transform your HTML portfolio into a visually appealing page using CSS and Flexbox.

### Requirements
1. Create a responsive layout using Flexbox
2. Add a color scheme and typography
3. Style the navigation menu
4. Create hover effects for interactive elements
5. Make it mobile-responsive

### Deliverables
- CSS file with complete styling
- Screenshots on desktop and mobile
- Explanation of flexbox usage

### Tips
- Use CSS custom properties for colors
- Mobile-first approach for responsive design
- Test on different screen sizes
    `,
    notes: "CSS can be tricky at first. Don't worry if it takes time to get the layout right.",
  },
  {
    id: "19",
    challengeId: "1",
    day: 19,
    title: "React Components",
    description: "Introduction to React and component-based architecture",
    deliverable: "Convert weather app to React components",
    isCompleted: false,
    isActive: true,
    points: 200,
    resources: [
      {
        id: "19",
        title: "React Components Documentation",
        type: "article",
        url: "https://react.dev/learn/your-first-component",
        description: "Official React documentation on components",
      },
      {
        id: "20",
        title: "React Components Tutorial",
        type: "video",
        url: "https://www.youtube.com/embed/dpw9EHDh2bM",
        description: "30-minute tutorial on React components",
      },
    ],
    instructions: `
## Today's Challenge: React Components

### Objective
Learn React fundamentals by converting your weather app into reusable components.

### Requirements
1. Set up a React development environment
2. Create functional components for different UI parts
3. Use props to pass data between components
4. Implement basic state management with useState
5. Handle user interactions with event handlers

### Deliverables
- React application with multiple components
- Component hierarchy diagram
- Code explanation of component structure

### Key Concepts to Learn
- JSX syntax and rules
- Component props and prop types
- State vs props
- Event handling in React
- Component composition

### Tips
- Start with create-react-app for quick setup
- Break down UI into small, reusable components
- Use React Developer Tools for debugging
    `,
    notes: "React has a learning curve, but it's worth it. Focus on understanding components first.",
  },
]

// Mock Challenge Participants
export const mockChallengeParticipants: ChallengeParticipant[] = [
  {
    id: "1",
    userId: "2",
    user: mockUsers[1],
    challengeId: "1",
    challenge: {} as Challenge,
    joinedAt: new Date("2024-02-01"),
    isActive: true,
    progress: 65,
  },
  {
    id: "2",
    userId: "3",
    user: mockUsers[2],
    challengeId: "1",
    challenge: {} as Challenge,
    joinedAt: new Date("2024-02-02"),
    isActive: true,
    progress: 45,
  },
]

// Mock Challenges
export const mockChallenges: Challenge[] = [
  {
    id: "1",
    title: "30-Day Coding Challenge",
    description: "Build 30 projects in 30 days to master web development fundamentals",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-03-01"),
    isActive: true,
    participants: mockChallengeParticipants.filter((p) => p.challengeId === "1"),
    posts: [],
    createdAt: new Date("2024-01-25"),
    depositAmount: 50,
    maxParticipants: 100,
    completionReward: 25,
    topPerformerBonus: 100,
    streakBonus: 10,
    category: "Web Development",
    difficulty: "Beginner",
    duration: "30 days",
    thumbnail: "/placeholder.svg?height=200&width=300",
    notes: "This challenge is designed to build consistent coding habits. Focus on completing each day's task.",
    resources: mockChallengeResources,
  },
  {
    id: "2",
    title: "React Mastery Challenge",
    description: "Master React hooks, context, and advanced patterns in 21 days",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    startDate: new Date("2024-03-15"),
    endDate: new Date("2024-04-05"),
    isActive: false,
    participants: [],
    posts: [],
    createdAt: new Date("2024-02-15"),
    depositAmount: 75,
    maxParticipants: 50,
    completionReward: 40,
    topPerformerBonus: 150,
    streakBonus: 15,
    category: "Web Development",
    difficulty: "Intermediate",
    duration: "21 days",
    thumbnail: "/placeholder.svg?height=200&width=300",
    notes: "Advanced React concepts require practice. Don't rush through the material.",
    resources: mockChallengeResources,
  },
  {
    id: "3",
    title: "CSS Animation Bootcamp",
    description: "Create stunning animations and transitions in 14 days",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    startDate: new Date("2024-04-01"),
    endDate: new Date("2024-04-14"),
    isActive: false,
    participants: [],
    posts: [],
    createdAt: new Date("2024-03-10"),
    depositAmount: 40,
    maxParticipants: 75,
    completionReward: 20,
    topPerformerBonus: 80,
    streakBonus: 8,
    category: "Design",
    difficulty: "Intermediate",
    duration: "14 days",
    thumbnail: "/placeholder.svg?height=200&width=300",
    notes: "CSS animations can greatly enhance user experience. Practice with different easing functions.",
    resources: mockChallengeResources,
  },
]

// Mock Session Resources
export const mockSessionResources: SessionResource[] = [
  {
    id: "1",
    title: "Code Review Checklist",
    type: "pdf",
    url: "/resources/code-review-checklist.pdf",
    description: "Comprehensive checklist for code reviews",
    order: 1,
  },
  {
    id: "2",
    title: "Career Development Guide",
    type: "article",
    url: "https://example.com/career-guide",
    description: "Step-by-step career development roadmap",
    order: 2,
  },
]

// Mock Sessions
export const mockSessions: Session[] = [
  {
    id: "1",
    title: "1-on-1 Code Review Session",
    description: "Get personalized feedback on your code and projects from an experienced developer",
    duration: 60,
    price: 150,
    currency: "TND",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    isActive: true,
    bookings: [],
    createdAt: new Date("2024-01-18"),
    category: "Code Review",
    maxBookingsPerWeek: 5,
    notes: "Come prepared with specific code you'd like reviewed. Share your repository link in advance.",
    resources: mockSessionResources.slice(0, 1),
  },
  {
    id: "2",
    title: "Career Mentorship Session",
    description: "Get guidance on your web development career path and industry insights",
    duration: 45,
    price: 120,
    currency: "TND",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    isActive: true,
    bookings: [],
    createdAt: new Date("2024-01-19"),
    category: "Career",
    maxBookingsPerWeek: 3,
    notes: "Bring your resume and specific career questions. We'll create a personalized development plan.",
    resources: mockSessionResources,
  },
  {
    id: "3",
    title: "UI/UX Design Review",
    description: "Get feedback on your design projects and learn best practices",
    duration: 45,
    price: 100,
    currency: "TND",
    communityId: "1",
    community: communitiesData.communities[0],
    creatorId: "1",
    creator: mockUsers[0],
    isActive: true,
    bookings: [],
    createdAt: new Date("2024-01-20"),
    category: "Design",
    maxBookingsPerWeek: 5,
    notes: "Share your design files (Figma, Sketch, etc.) before the session for better feedback.",
    resources: mockSessionResources,
  },
]

// Mock Session Bookings
export const mockBookings: SessionBooking[] = [
  {
    id: "1",
    sessionId: "1",
    session: mockSessions[0],
    userId: "2",
    user: mockUsers[1],
    scheduledAt: new Date("2024-02-20T14:00:00"),
    status: "confirmed",
    meetingUrl: "https://meet.google.com/abc-def-ghi",
    notes: "Review React project structure",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "2",
    sessionId: "2",
    session: mockSessions[1],
    userId: "3",
    user: mockUsers[2],
    scheduledAt: new Date("2024-02-22T10:00:00"),
    status: "pending",
    notes: "Need help with career transition strategy",
    createdAt: new Date("2024-02-18"),
    updatedAt: new Date("2024-02-18"),
  },
]

// Mock Posts
export const mockPosts: Post[] = [
  {
    id: "1",
    title: "Getting Started with React Hooks",
    content:
      "React Hooks have revolutionized how we write React components. In this post, I'll share my experience and best practices for using hooks effectively in your projects.",
    excerpt: "Learn the fundamentals of React Hooks and how they can simplify your code.",
    thumbnail: "/placeholder.svg?height=200&width=400",
    communityId: "1",
    community: communitiesData.communities[0],
    authorId: "1",
    author: mockUsers[0],
    isPublished: true,
    likes: 45,
    comments: [],
    tags: ["react", "hooks", "javascript"],
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "2",
    title: "CSS Grid vs Flexbox: When to Use What",
    content:
      "Both CSS Grid and Flexbox are powerful layout systems, but knowing when to use each one can make a huge difference in your development workflow.",
    excerpt: "Understanding the differences and use cases for CSS Grid and Flexbox.",
    thumbnail: "/placeholder.svg?height=200&width=400",
    communityId: "1",
    community: communitiesData.communities[0],
    authorId: "1",
    author: mockUsers[0],
    isPublished: true,
    likes: 32,
    comments: [],
    tags: ["css", "layout", "grid", "flexbox"],
    createdAt: new Date("2024-02-12"),
    updatedAt: new Date("2024-02-12"),
  },
]

// Mock Landing Page Config
export const mockLandingConfig: LandingPageConfig[] = [
  {
    id: "1",
    communityId: "1",
    community: communitiesData.communities[0],
    heroTitle: "Master Web Development",
    heroSubtitle: "Join thousands of developers learning modern web technologies",
    heroImage: "/placeholder.svg?height=400&width=600",
    primaryColor: "#8e78fb",
    secondaryColor: "#47c7ea",
    features: [
      {
        id: "1",
        title: "Expert-Led Courses",
        description: "Learn from industry professionals with years of experience",
        icon: "graduation-cap",
        order: 1,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
      {
        id: "2",
        title: "Hands-On Projects",
        description: "Build real-world projects to showcase in your portfolio",
        icon: "code",
        order: 2,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
      {
        id: "3",
        title: "Community Support",
        description: "Get help from peers and mentors in our active community",
        icon: "users",
        order: 3,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
    ],
    testimonials: [
      {
        id: "1",
        content: "This community transformed my career. The courses are top-notch!",
        authorName: "Mike Chen",
        authorAvatar: "/placeholder.svg?height=50&width=50",
        authorTitle: "Frontend Developer",
        rating: 5,
        order: 1,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
    ],
    isActive: true,
    updatedAt: new Date("2024-02-01"),
    createdAt: new Date("2024-02-01"),
  },
]

// Helper functions to get data
export const getUserById = (id: string): User | undefined => mockUsers.find((user) => user.id === id)

export const getCommunityBySlug = (slug: string): Community | undefined =>
  communitiesData.communities.find((community) => community.slug === slug)

export const getCommunitiesByCreator = (creatorId: string): Community[] =>
  communitiesData.communities.filter((community) => community.creatorId === creatorId)

export const getUserCommunities = (userId: string): Community[] => {
  const memberships = mockCommunityMembers.filter((member) => member.userId === userId && member.isActive)
  return memberships.map((membership) => membership.community)
}

export const getCoursesByCommunity = (communityId: string): Course[] =>
  mockCourses.filter((course) => course.communityId === communityId)

export const getCourseById = (courseId: string): Course | undefined =>
  mockCourses.find((course) => course.id === courseId)

export const getUserEnrollments = (userId: string): CourseEnrollment[] =>
  mockEnrollments.filter((enrollment) => enrollment.userId === userId && enrollment.isActive)

export const getChallengesByCommunity = (communityId: string): Challenge[] =>
  mockChallenges.filter((challenge) => challenge.communityId === communityId)

export const getChallengeById = (challengeId: string): Challenge | undefined =>
  mockChallenges.find((challenge) => challenge.id === challengeId)

export const getChallengeTasks = (challengeId: string) =>
  mockChallengeTasks.filter((task) => task.challengeId === challengeId)

export const getActiveChallengesByCommunity = (communityId: string): Challenge[] =>
  mockChallenges.filter((challenge) => challenge.communityId === communityId && challenge.isActive)

export const getUserChallengeParticipation = (userId: string, challengeId: string): ChallengeParticipant | undefined =>
  mockChallengeParticipants.find(
    (participant) => participant.userId === userId && participant.challengeId === challengeId,
  )

export const getSessionsByCommunity = (communityId: string): Session[] =>
  mockSessions.filter((session) => session.communityId === communityId && session.isActive)

export const getSessionById = (sessionId: string): Session | undefined =>
  mockSessions.find((session) => session.id === sessionId)

export const getUserBookings = (userId: string): SessionBooking[] =>
  mockBookings.filter((booking) => booking.userId === userId)

export const getPostsByCommunity = (communityId: string): Post[] =>
  mockPosts.filter((post) => post.communityId === communityId && post.isPublished)

// Authentication helpers
export const authenticateUser = (email: string, password: string): User | null => {
  // Simple mock authentication
  const user = mockUsers.find((u) => u.email === email)
  return user || null
}

export const getCurrentUser = (): User | null => {
  // Mock current user - in real app this would check session/token
  return mockUsers[0] // Return Sarah Johnson as default logged in user
}




// Mock speakers
const mockSpeakers: EventSpeaker[] = [
  {
    id: 'speaker1',
    name: 'Dr. Rebecca Miller',
    title: 'Chief Technology Officer at TechCorp',
    bio: 'Expert in AI and machine learning with 15 years of industry experience',
    photo: '/speakers/1.jpg'
  },
  {
    id: 'speaker2',
    name: 'Mark Chen',
    title: 'Senior Product Designer at DesignHub',
    bio: 'Specializes in UX design and design thinking methodologies',
    photo: '/speakers/2.jpg'
  },
  {
    id: 'speaker3',
    name: 'Lisa Rodriguez',
    title: 'Marketing Director at GrowthMarketing',
    bio: 'Digital marketing strategist with focus on social media and growth hacking',
  },
]

// Helper function to generate dates
const createDate = (daysFromNow: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

// Mock events data
export const mockEvents: Event[] = [
  {
    id: 'event1',
    title: 'Tech Conference 2023',
    description: 'Annual technology conference featuring the latest innovations in software development and AI',
    image: '/events/tech-conf.jpg',
    startDate: createDate(14),
    endDate: createDate(16),
    startTime: '09:00',
    endTime: '18:00',
    timezone: 'EST',
    location: 'New York Convention Center',
    onlineUrl: 'https://example.com/tech-conf-2023',
    category: 'Technology',
    type: 'Hybrid',
    isActive: true,
    price: 299,
    notes: 'Keynote speaker needs green room with bottled water and vegan meal option',
    attendees: [],
    sessions: [],
    tickets: [
      {
        id: 'ticket1',
        type: 'early-bird',
        name: 'Early Bird Pass',
        price: 199,
        description: 'Access to all sessions and lunch included',
        quantity: 100,
        sold: 92
      },
      {
        id: 'ticket2',
        type: 'regular',
        name: 'Standard Pass',
        price: 299,
        description: 'Access to all sessions',
        quantity: 300,
        sold: 245
      },
      {
        id: 'ticket3',
        type: 'vip',
        name: 'VIP Experience',
        price: 599,
        description: 'All access plus exclusive networking event',
        quantity: 50,
        sold: 48
      }
    ],
    speakers: [mockSpeakers[0], mockSpeakers[1]]
  },
  {
    id: 'event2',
    title: 'Digital Marketing Summit',
    description: 'Learn cutting-edge digital marketing strategies from industry leaders',
    image: '/events/marketing-summit.jpg',
    startDate: createDate(30),
    endDate: createDate(31),
    startTime: '10:00',
    endTime: '17:00',
    timezone: 'PST',
    location: 'San Francisco Marriott',
    category: 'Marketing',
    type: 'In-person',
    isActive: true,
    price: 149,
    notes: "Networking session included.",
    attendees: [],
    sessions: [],
    tickets: [
      {
        id: 'ticket4',
        type: 'regular',
        name: 'General Admission',
        price: 249,
        description: 'Access to all keynote presentations and breakout sessions',
        quantity: 200,
        sold: 187
      },
      {
        id: 'ticket5',
        type: 'student',
        name: 'Student Pass',
        price: 99,
        description: 'Discounted rate for students with valid ID',
        sold: 42
      }
    ],
    speakers: [mockSpeakers[2]]
  },
  {
    id: 'event3',
    title: 'Remote Work Masterclass',
    description: 'Strategies and tools for effective remote work in distributed teams',
    location: 'Online',
    startDate: createDate(5),
    endDate: createDate(5),
    startTime: '13:00',
    endTime: '16:00',
    timezone: 'UTC',
    onlineUrl: 'https://example.com/remote-work-masterclass',
    category: 'Business',
    type: 'Online',
    isActive: true,
    price: 49,
    attendees: [],
    sessions: [],
    tickets: [
      {
        id: 'ticket6',
        type: 'regular',
        name: 'Virtual Access',
        price: 49,
        description: 'Live access to the masterclass and Q&A session',
        sold: 156
      }
    ],
    speakers: [mockSpeakers[1]]
  },
  {
    id: 'event4',
    title: 'Health & Wellness Expo',
    description: 'Explore the latest trends in health, fitness, and holistic wellness',
    image: '/events/wellness-expo.jpg',
    startDate: createDate(-10),
    endDate: createDate(-9),
    startTime: '08:00',
    endTime: '20:00',
    timezone: 'CET',
    location: 'Berlin ExpoCenter',
    category: 'Health',
    type: 'In-person',
    isActive: false,
    price: 199,
    notes: "Lunch and refreshments will be provided.",
    attendees: [],
    sessions: [],
    tickets: [
      {
        id: 'ticket7',
        type: 'regular',
        name: 'Day Pass',
        price: 35,
        description: 'Access for one day',
        sold: 320
      },
      {
        id: 'ticket8',
        type: 'vip',
        name: 'Weekend VIP',
        price: 90,
        description: 'Access both days with premium seating',
        sold: 85
      }
    ],
    speakers: []
  }
]

// Mock event sessions
export const mockEventSessions: Record<string, EventSession[]> = {
  event1: [
    {
      id: 'session1',
      title: 'Keynote: The Future of AI',
      description: 'Opening keynote discussing emerging trends in artificial intelligence',
      startTime: '09:00',
      endTime: '10:30',
      speaker: 'Dr. Rebecca Miller',
      attendance: 85,
      isActive: true
    },
    {
      id: 'session2',
      title: 'UX Design Workshop',
      description: 'Hands-on workshop for improving user experience in digital products',
      startTime: '11:00',
      endTime: '13:00',
      speaker: 'Mark Chen',
      attendance: 42,
      notes: 'Need 30 laptops for workshop',
      isActive: true
    }
  ],
  event2: [
    {
      id: 'session3',
      title: 'Social Media Strategies',
      description: 'Learn how to build an effective social media marketing plan',
      startTime: '10:00',
      endTime: '11:30',
      speaker: 'Lisa Rodriguez',
      attendance: 78,
      isActive: true
    }
  ],
  event3: [
    {
      id: 'session4',
      title: 'Remote Team Collaboration',
      description: 'Tools and techniques for effective remote teamwork',
      startTime: '13:00',
      endTime: '14:30',
      speaker: 'Mark Chen',
      attendance: 63,
      isActive: true
    },
    {
      id: 'session5',
      title: 'Q&A Panel',
      description: 'Ask your remote work questions to our expert panel',
      startTime: '15:00',
      endTime: '16:00',
      speaker: 'Mark Chen',
      attendance: 57,
      isActive: true
    }
  ],
  event4: []
}

// Data access functions
export const getEvents = (): Event[] => {
  return mockEvents
}

export const getEventById = (id: string): Event | undefined => {
  return mockEvents.find(event => event.id === id)
}

export const getEventSessions = (eventId: string): EventSession[] => {
  return mockEventSessions[eventId] || []
}

export const getUpcomingEvents = (): Event[] => {
  const now = new Date()
  return mockEvents.filter(event => event.startDate > now)
}

export const getPastEvents = (): Event[] => {
  const now = new Date()
  return mockEvents.filter(event => event.startDate <= now)
}
// lib/mock-data.ts


// Add to your existing mock data
// lib/mock-data.ts

export const mockProducts: Product[] = [
  {
    id: "prod_1",
    communityId: "1",
    title: "Ultimate UI Kit for Figma",
    description: "150+ customizable components for modern web and mobile apps",
    price: 49.99,
    isPublished: true,
    sales: 215,
    category: "Templates",
    images: ["/placeholder.svg?height=400&width=400&query=figma"],
    variants: [
      { id: "var1", name: "Small", price: 29.99 },
      { id: "var2", name: "Medium", price: 29.99 },
      { id: "var3", name: "Large", price: 29.99 },
    ],
    files: [
      {
        id: "file1",
        name: "UI_Kit.fig",
        url: "https://example.com/download/ui-kit",
        type: "Figma",
        size: "8.5MB"
      },
      {
        id: "file2",
        name: "Documentation.pdf",
        url: "https://example.com/download/docs",
        type: "PDF",
        size: "2.1MB"
      }
    ],
    rating: 4.9,
    createdAt: "2023-10-15",
    creator: {
      id: "user_3",
      name: "Design Master",
      avatar: "/placeholder.svg?height=100&width=100&query=designer"
    },
    licenseTerms: "License includes personal and commercial use for up to 3 projects. Extended license available.",
    features: [
      "150+ fully customizable components",
      "Auto-layout enabled",
      "Dark/light mode variants",
      "Free lifetime updates",
      "24/7 support"
    ]
  },
  {
    id: "prod_3",
    communityId: "1",
    title: "Premium Icon Pack",
    description: "1000+ vector icons in 5 different styles",
    price: 14.99,
    isPublished: true,
    sales: 356,
    category: "Assets",
    images: ["/placeholder.svg?height=400&width=400&query=icons"],
    variants: [
      { id: "var1", name: "Small", price: 29.99 },
      { id: "var2", name: "Medium", price: 29.99 },
      { id: "var3", name: "Large", price: 29.99 },
    ],
    files: [
      {
        id: "file1",
        name: "Icons_SVG.zip",
        url: "https://example.com/download/svg",
        type: "SVG",
        size: "12MB"
      },
      {
        id: "file2",
        name: "Icons_PNG.zip",
        url: "https://example.com/download/png",
        type: "PNG",
        size: "28MB"
      }
    ],
    rating: 4.8,
    createdAt: "2023-11-05",
    creator: {
      id: "user_2",
      name: "Vector Art",
      avatar: "/placeholder.svg?height=100&width=100&query=artist"
    },
    licenseTerms: "Royalty-free for personal and commercial use. Attribution not required but appreciated."
  }
]

export const mockPurchases: Purchase[] = [
  {
    id: "purchase_1",
    userId: "2",
    productId: "prod_1",
    purchasedAt: "2023-11-20T14:30:00Z",
    downloadCount: 3
  }
]

// Add these to your existing mock functions
export function getProductsByCommunity(communityId: string): Product[] {
  return mockProducts.filter(product => product.communityId === communityId)
}
export function getProductById(productId: string): Product | undefined {
  return mockProducts.find(product => product.id === productId)
}
export function getUserPurchases(userId: string): Purchase[] {
  return mockPurchases.filter(purchase => purchase.userId === userId)
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<boolean> {
  const index = mockProducts.findIndex(p => p.id === productId)
  if (index === -1) return false

  mockProducts[index] = { ...mockProducts[index], ...data }
  return true
}


export const availableEvents: Event[] = [
  {
    id: "1",
    title: "Next.js Conference 2025",
    description: "Explore the latest in React, Next.js, and full-stack development.",
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    startTime: "09:00",
    endTime: "18:00",
    timezone: "GMT+1",
    location: "Paris Convention Center",
    onlineUrl: "https://event-platform.com/nextconf",
    category: "Tech Conference",
    type: "Hybrid",
    isActive: true,
    price: 150,
    image: "/placeholder.svg?height=300&width=600",
    notes: "Bring your laptop for workshops.",
    attendees: [],
    tickets: [
      { id: "t1", type: "regular", name: "Regular Pass", price: 100, description: "Access to all talks", sold: 50 },
      { id: "t2", type: "vip", name: "VIP Pass", price: 250, description: "VIP Lounge & Speaker Dinner", sold: 10 },
    ],
    speakers: [
      { id: "s1", name: "John Doe", title: "React Core Team", bio: "Core contributor to React", photo: "/placeholder.svg?height=80&width=80" },
    ],
    sessions: [],
  },
  {
    id: "2",
    title: "AI & Machine Learning Summit",
    description: "Latest research and applications in AI.",
    startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
    startTime: "10:00",
    endTime: "17:00",
    timezone: "GMT+1",
    location: "Berlin Tech Hub",
    category: "AI & ML",
    type: "In-person",
    isActive: true,
    price: 80,
    image: "/placeholder.svg?height=300&width=600",
    attendees: [],
    tickets: [
      { id: "t3", type: "regular", name: "General", price: 80, description: "Conference access", sold: 120 },
      { id: "t4", type: "early-bird", name: "Early Bird", price: 50, description: "Discounted ticket", sold: 200 },
    ],
    speakers: [
      { id: "s2", name: "Alice Martin", title: "AI Researcher", bio: "Works on neural networks at Google", photo: "/placeholder.svg?height=80&width=80" },
    ],
    sessions: [],
  },
  {
    id: "3",
    title: "Startup Pitch Night",
    description: "Watch 10 startups pitch to investors.",
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    startTime: "18:00",
    endTime: "22:00",
    timezone: "GMT+1",
    location: "Tunis Innovation Center",
    category: "Entrepreneurship",
    type: "In-person",
    isActive: true,
    price: 0,
    image: "/placeholder.svg?height=300&width=600",
    attendees: [],
    tickets: [
      { id: "t5", type: "free", name: "General Admission", price: 0, description: "Free entry", sold: 300 },
    ],
    speakers: [],
    sessions: [],
  },
  {
    id: "4",
    title: "Remote Work Webinar",
    description: "Best practices for effective remote collaboration.",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    startTime: "15:00",
    endTime: "16:30",
    timezone: "GMT+1",
    location: "Online",
    onlineUrl: "https://zoom.com/remote-work",
    category: "Workplace",
    type: "Online",
    isActive: true,
    price: 49,
    notes: "Please join 5 minutes early to check your audio/video setup.",
    attendees: [],
    tickets: [
      { id: "t6", type: "regular", name: "Free Ticket", price: 0, description: "Online access", sold: 500 },
    ],
    speakers: [
      { id: "s3", name: "Mark Lee", title: "Productivity Coach", bio: "Helps companies go remote-first", photo: "/placeholder.svg?height=80&width=80" },
    ],
    sessions: [],
  },
]

export const myTickets = [
  {
    id: "r1",
    event: availableEvents[0],
    ticket: availableEvents[0].tickets[0],
    quantity: 1,
    status: "confirmed" as const,
  },
  {
    id: "r2",
    event: availableEvents[1],
    ticket: availableEvents[1].tickets[1],
    quantity: 2,
    status: "pending" as const,
  },
  {
    id: "r3",
    event: availableEvents[3],
    ticket: availableEvents[3].tickets[0],
    quantity: 1,
    status: "confirmed" as const,
  },
]