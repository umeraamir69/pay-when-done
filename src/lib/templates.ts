import type { JobCategory, JobPriority } from "./types";

export type JobTemplate = {
  id: string;
  label: string;
  title: string;
  brief: string;
  amount: number;
  category: JobCategory;
  priority: JobPriority;
  tags: string[];
  audience: string;
};

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    id: "clean",
    label: "Bathroom clean",
    title: "Bathroom deep clean + grout refresh",
    brief:
      "Clean both bathrooms. Remove soap scum from glass shower doors. Whiten grout on floor tiles. Empty trash. Take clear after photos of shower glass and floor.",
    amount: 85,
    category: "cleaning",
    priority: "high",
    tags: ["same-day", "residential"],
    audience: "Homeowners hiring off Nextdoor / Facebook",
  },
  {
    id: "move",
    label: "Moving help",
    title: "2-hour apartment move assist",
    brief:
      "Help load and unload a studio apartment. Protect floors with blankets. Assemble bed frame on arrival. Photo of emptied old unit and set-up bed at new place.",
    amount: 120,
    category: "moving",
    priority: "normal",
    tags: ["weekend"],
    audience: "Renters coordinating day laborers",
  },
  {
    id: "tutor",
    label: "Tutoring",
    title: "SAT math tutoring — 90 minutes",
    brief:
      "Live 90-minute SAT math session covering algebra and data analysis. Share a one-page summary of topics covered and 5 practice problems assigned. Screenshot of session end time.",
    amount: 60,
    category: "tutoring",
    priority: "low",
    tags: ["remote"],
    audience: "Parents booking independent tutors",
  },
  {
    id: "handyman",
    label: "Handyman",
    title: "Deck railing repair",
    brief:
      "Replace loose railing posts on backyard deck. Sand and seal cut ends. Safety check photos of every post after install.",
    amount: 220,
    category: "handyman",
    priority: "high",
    tags: ["urgent"],
    audience: "Homeowners avoiding marketplace fees",
  },
  {
    id: "photo",
    label: "Photo shoot",
    title: "Product photos — 20 edited shots",
    brief:
      "Shoot 20 product photos on white and lifestyle backgrounds. Deliver edited JPEGs in a shared folder. Include contact sheet thumbnail grid as proof.",
    amount: 180,
    category: "creative",
    priority: "normal",
    tags: ["deliverables"],
    audience: "Small shops hiring freelancers on WhatsApp",
  },
  {
    id: "lawn",
    label: "Lawn care",
    title: "Front + back lawn mow & edge",
    brief:
      "Mow front and back lawn, edge sidewalks, blow clippings off driveway. After photos of front yard, backyard, and driveway required.",
    amount: 55,
    category: "other",
    priority: "normal",
    tags: ["recurring-candidate"],
    audience: "Neighbors hiring seasonal help",
  },
];
