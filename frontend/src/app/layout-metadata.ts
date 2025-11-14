// Helper file for page metadata configuration
// Maps routes to their titles and descriptions

export const pageMetadata = {
  "/": {
    title: "HopOn - Find Pickup Games Nearby",
    description: "Find pickup games nearby, connect with players, and keep your schedule in sync.",
  },
  "/login": {
    title: "Sign In - HopOn",
    description: "Sign in to your HopOn account to access your games and player profile.",
  },
  "/signup": {
    title: "Create Account - HopOn",
    description: "Create a HopOn account to start finding and hosting pickup games.",
  },
  "/home": {
    title: "Home - HopOn",
    description: "Discover nearby pickup games and join your next game.",
  },
  "/discover": {
    title: "Discover - HopOn",
    description: "Explore available pickup games in your area.",
  },
  "/create": {
    title: "Create Game - HopOn",
    description: "Host and create your own pickup game.",
  },
  "/events": {
    title: "Events - HopOn",
    description: "View all upcoming pickup games and events.",
  },
  "/home/profile": {
    title: "Profile - HopOn",
    description: "View and manage your HopOn player profile.",
  },
  "/home/explore": {
    title: "Explore - HopOn",
    description: "Explore trending games and sports in your area.",
  },
  "/home/settings": {
    title: "Settings - HopOn",
    description: "Manage your HopOn account settings and preferences.",
  },
} as const;
