export interface Zap {
  id: string;
  name: string;
  status: "active" | "paused" | "error";
  triggerApp: {
    name: string;
    icon: string;
    color: string;
  };
  actions: Array<{
    name: string;
    icon: string;
    color: string;
  }>;
  lastRun?: string;
  totalRuns: number;
  createdAt: string;
  url: string;
}

export const MOCK_ZAPS: Zap[] = [
  {
    id: "1",
    name: "Gmail to Slack Notifications",
    status: "active",
    triggerApp: {
      name: "Gmail",
      icon: "✉️",
      color: "#EA4335",
    },
    actions: [
      {
        name: "Slack",
        icon: "💬",
        color: "#4A154B",
      },
    ],
    lastRun: "2 minutes ago",
    totalRuns: 1247,
    createdAt: "2024-01-15",
    url: "https://zapier.app/editor/abc123",
  },
  {
    id: "2",
    name: "Google Drive to Notion Sync",
    status: "active",
    triggerApp: {
      name: "Google Drive",
      icon: "📁",
      color: "#4285F4",
    },
    actions: [
      {
        name: "Notion",
        icon: "📝",
        color: "#000000",
      },
    ],
    lastRun: "1 hour ago",
    totalRuns: 523,
    createdAt: "2024-02-01",
    url: "https://zapier.app/editor/def456",
  },
  {
    id: "3",
    name: "Trello to Asana Task Transfer",
    status: "paused",
    triggerApp: {
      name: "Trello",
      icon: "📋",
      color: "#0079BF",
    },
    actions: [
      {
        name: "Asana",
        icon: "✓",
        color: "#F06A6A",
      },
      {
        name: "Slack",
        icon: "💬",
        color: "#4A154B",
      },
    ],
    lastRun: "3 days ago",
    totalRuns: 89,
    createdAt: "2024-03-10",
    url: "https://zapier.app/editor/ghi789",
  },
  {
    id: "4",
    name: "Airtable to Gmail Reports",
    status: "error",
    triggerApp: {
      name: "Airtable",
      icon: "🗂️",
      color: "#FCB400",
    },
    actions: [
      {
        name: "Gmail",
        icon: "✉️",
        color: "#EA4335",
      },
    ],
    lastRun: "5 hours ago",
    totalRuns: 234,
    createdAt: "2024-01-28",
    url: "https://zapier.app/editor/jkl012",
  },
  {
    id: "5",
    name: "Dropbox to Google Drive Backup",
    status: "active",
    triggerApp: {
      name: "Dropbox",
      icon: "📦",
      color: "#0061FF",
    },
    actions: [
      {
        name: "Google Drive",
        icon: "📁",
        color: "#4285F4",
      },
      {
        name: "Slack",
        icon: "💬",
        color: "#4A154B",
      },
    ],
    lastRun: "30 minutes ago",
    totalRuns: 892,
    createdAt: "2024-02-15",
    url: "https://zapier.app/editor/mno345",
  },
  {
    id: "6",
    name: "Slack to Notion Meeting Notes",
    status: "active",
    triggerApp: {
      name: "Slack",
      icon: "💬",
      color: "#4A154B",
    },
    actions: [
      {
        name: "Notion",
        icon: "📝",
        color: "#000000",
      },
    ],
    lastRun: "45 minutes ago",
    totalRuns: 156,
    createdAt: "2024-03-05",
    url: "https://zapier.app/editor/pqr678",
  },
];
