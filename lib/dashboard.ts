import {
  AccessIcon,
  Analytics01Icon,
  ArrowReloadHorizontalIcon,
  Calendar03Icon,
  ContactBookIcon,
  DeliveryTruck01Icon,
  Home01Icon,
  InboxIcon,
  LibraryIcon,
  Mortarboard01Icon,
  PackageIcon,
  Settings01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

// Staff dashboard navigation. Counts come live from the store (lib/dashboard-counts.ts).
export type DashboardItem = {
  slug: string; // "" = /dashboard (Today)
  title: string;
  description: string;
  icon: typeof Home01Icon;
};

export type DashboardSection = { label?: string; items: DashboardItem[] };

export const DASHBOARD_NAV: DashboardSection[] = [
  {
    items: [
      {
        slug: "",
        title: "Today",
        description: "What needs doing today.",
        icon: Home01Icon,
      },
    ],
  },
  {
    label: "Library",
    items: [
      {
        slug: "library/requests",
        title: "Requests",
        description: "New borrowing requests waiting for a decision.",
        icon: InboxIcon,
      },
      {
        slug: "library/to-ship",
        title: "To ship",
        description: "Approved requests that need packing and shipping.",
        icon: PackageIcon,
      },
      {
        slug: "library/on-loan",
        title: "On loan",
        description: "Items out with people. Overdue loans show at the top.",
        icon: DeliveryTruck01Icon,
      },
      {
        slug: "library/returns",
        title: "Returns & cleaning",
        description: "Items that came back. Check and clean before lending again.",
        icon: ArrowReloadHorizontalIcon,
      },
      {
        slug: "library/catalog",
        title: "Catalog",
        description: "All items and copies. Add new items here.",
        icon: LibraryIcon,
      },
    ],
  },
  {
    label: "Events",
    items: [
      {
        slug: "events",
        title: "Upcoming events",
        description: "Webinars, workshops and the conference.",
        icon: Calendar03Icon,
      },
      {
        slug: "events/accommodations",
        title: "Accommodations",
        description: "Interpreters, captions and childcare to arrange.",
        icon: AccessIcon,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        slug: "inbox",
        title: "Inbox",
        description: "Messages from the contact form.",
        icon: InboxIcon,
      },
      {
        slug: "contacts",
        title: "Contacts",
        description: "Everyone we’ve helped, with their full history.",
        icon: ContactBookIcon,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        slug: "courses",
        title: "Courses",
        description: "Create and edit free courses.",
        icon: Mortarboard01Icon,
      },
      {
        slug: "family-guides",
        title: "Family guides",
        description: "Plain-language guides for each stage of life.",
        icon: UserGroupIcon,
      },
    ],
  },
  {
    items: [
      {
        slug: "reports",
        title: "Reports",
        description: "Numbers for funders and the board.",
        icon: Analytics01Icon,
      },
    ],
  },
];

export const DASHBOARD_SETTINGS: DashboardItem = {
  slug: "settings",
  title: "Settings",
  description: "Your account, team members and site settings.",
  icon: Settings01Icon,
};

export const ALL_DASHBOARD_ITEMS: DashboardItem[] = [
  ...DASHBOARD_NAV.flatMap((s) => s.items),
  DASHBOARD_SETTINGS,
];

export const dashboardHref = (slug: string) => (slug ? `/dashboard/${slug}` : "/dashboard");
