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

export const TEMPLATE_CATEGORIES: Array<JobCategory | "all"> = [
  "all",
  "cleaning",
  "moving",
  "tutoring",
  "handyman",
  "creative",
  "other",
];

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
    tags: ["same-day", "residential", "bathrooms"],
    audience: "Homeowners hiring off Nextdoor / Facebook",
  },
  {
    id: "clean-kitchen",
    label: "Kitchen reset",
    title: "Kitchen deep clean + appliance wipe-down",
    brief:
      "Degrease stovetop and range hood. Clean inside microwave and exterior of fridge. Wipe cabinets to shoulder height. Scrub sink and faucet. Empty under-sink trash. After photos of stove, sink, and counters required.",
    amount: 95,
    category: "cleaning",
    priority: "normal",
    tags: ["residential", "kitchen"],
    audience: "Busy households booking weekend help",
  },
  {
    id: "clean-moveout",
    label: "Move-out clean",
    title: "2BR move-out clean for deposit return",
    brief:
      "Full move-out clean of 2-bedroom apartment: kitchens, baths, baseboards, inside cabinets and fridge. Leave broom-clean floors. Photo checklist: each room empty + cleaned, oven interior, shower glass.",
    amount: 240,
    category: "cleaning",
    priority: "high",
    tags: ["move-out", "checklist", "deposit"],
    audience: "Renters racing a lease end date",
  },
  {
    id: "clean-office",
    label: "Office tidy",
    title: "Small office evening tidy (up to 8 desks)",
    brief:
      "Empty desk bins, wipe surfaces, vacuum high-traffic paths, restock bathroom paper goods, wipe kitchenette counters. Lock checklist photo of lobby and kitchenette before leaving.",
    amount: 75,
    category: "cleaning",
    priority: "normal",
    tags: ["commercial", "recurring-candidate"],
    audience: "Small teams without a janitorial contract",
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
    tags: ["weekend", "labor"],
    audience: "Renters coordinating day laborers",
  },
  {
    id: "move-truck",
    label: "Truck load",
    title: "Load 16ft rental truck — ground floor",
    brief:
      "Load a 16ft rental truck from a ground-floor unit. Wrap furniture, strap heavy items, maximize space. Photo of packed truck interior and emptied living room before departure.",
    amount: 160,
    category: "moving",
    priority: "high",
    tags: ["same-day", "truck", "labor"],
    audience: "DIY movers who need muscle, not a full crew",
  },
  {
    id: "move-furniture",
    label: "Furniture haul",
    title: "Haul away couch + mattress (curbside)",
    brief:
      "Carry sofa and queen mattress from 2nd-floor walk-up to curb or donation truck. Protect walls on stairs. Photo of cleared room and items at curb/truck.",
    amount: 90,
    category: "moving",
    priority: "normal",
    tags: ["haul-away", "stairs"],
    audience: "People replacing furniture this weekend",
  },
  {
    id: "move-unpack",
    label: "Unpack kitchen",
    title: "Kitchen unpack + cabinet organize (3 hrs)",
    brief:
      "Unpack kitchen boxes, place dishes and pantry items logically, flatten cardboard. Leave counters clear. Photo of open cabinets and recycled box stack.",
    amount: 110,
    category: "moving",
    priority: "low",
    tags: ["unpack", "organize"],
    audience: "New movers who hate living out of boxes",
  },
  {
    id: "tutor",
    label: "SAT math",
    title: "SAT math tutoring — 90 minutes",
    brief:
      "Live 90-minute SAT math session covering algebra and data analysis. Share a one-page summary of topics covered and 5 practice problems assigned. Screenshot of session end time.",
    amount: 60,
    category: "tutoring",
    priority: "low",
    tags: ["remote", "SAT"],
    audience: "Parents booking independent tutors",
  },
  {
    id: "tutor-writing",
    label: "Essay coach",
    title: "College essay coaching — one draft pass",
    brief:
      "Review one college application essay (≤650 words). Deliver tracked edits plus a half-page note on structure, voice, and next revisions. Screenshot of shared doc with comments.",
    amount: 75,
    category: "tutoring",
    priority: "normal",
    tags: ["remote", "writing", "college"],
    audience: "Seniors polishing applications",
  },
  {
    id: "tutor-coding",
    label: "Python intro",
    title: "Intro Python session — 60 minutes",
    brief:
      "Live intro Python lesson: variables, loops, and one mini project. Share a GitHub gist or Colab notebook of what was built plus 3 homework exercises. Session end screenshot.",
    amount: 55,
    category: "tutoring",
    priority: "normal",
    tags: ["remote", "coding", "python"],
    audience: "Adults learning to code evenings",
  },
  {
    id: "tutor-spanish",
    label: "Spanish convo",
    title: "Spanish conversation hour (A2–B1)",
    brief:
      "60-minute spoken Spanish practice at A2–B1. Cover travel and daily-life topics. Send a vocab list of 15 new phrases and a 2-minute voice note summary. Call end screenshot.",
    amount: 45,
    category: "tutoring",
    priority: "low",
    tags: ["remote", "language", "spanish"],
    audience: "Travelers brushing up before a trip",
  },
  {
    id: "handyman",
    label: "Deck railing",
    title: "Deck railing repair",
    brief:
      "Replace loose railing posts on backyard deck. Sand and seal cut ends. Safety check photos of every post after install.",
    amount: 220,
    category: "handyman",
    priority: "high",
    tags: ["urgent", "outdoor"],
    audience: "Homeowners avoiding marketplace fees",
  },
  {
    id: "handy-faucet",
    label: "Faucet swap",
    title: "Kitchen faucet replacement",
    brief:
      "Remove old kitchen faucet, install provided replacement, check for leaks under sink. After photos of faucet running and dry cabinet base.",
    amount: 140,
    category: "handyman",
    priority: "normal",
    tags: ["plumbing", "indoor"],
    audience: "Owners with parts already purchased",
  },
  {
    id: "handy-tv",
    label: "TV mount",
    title: "Mount 55–65\" TV + hide cables",
    brief:
      "Wall-mount TV on studs with provided mount. Level check, cable management to outlet or in-wall kit. Photo of mounted TV, level app reading, and tidy cable run.",
    amount: 125,
    category: "handyman",
    priority: "normal",
    tags: ["mounting", "living-room"],
    audience: "Apartment renters with landlord approval",
  },
  {
    id: "handy-shelf",
    label: "Shelf hang",
    title: "Hang 3 floating shelves + level",
    brief:
      "Install three floating shelves on marked wall. Use anchors appropriate for drywall/studs. Photo of each shelf with level and items placed without sag.",
    amount: 95,
    category: "handyman",
    priority: "low",
    tags: ["mounting", "indoor"],
    audience: "New renters setting up a bedroom",
  },
  {
    id: "photo",
    label: "Product photos",
    title: "Product photos — 20 edited shots",
    brief:
      "Shoot 20 product photos on white and lifestyle backgrounds. Deliver edited JPEGs in a shared folder. Include contact sheet thumbnail grid as proof.",
    amount: 180,
    category: "creative",
    priority: "normal",
    tags: ["deliverables", "photography"],
    audience: "Small shops hiring freelancers on WhatsApp",
  },
  {
    id: "creative-logo",
    label: "Logo refresh",
    title: "Logo refresh — 3 concepts + final files",
    brief:
      "Deliver 3 logo concepts based on brand notes, one revision round on the chosen direction, and final SVG + PNG exports. Proof: concept board PDF and export folder link.",
    amount: 250,
    category: "creative",
    priority: "normal",
    tags: ["design", "branding", "deliverables"],
    audience: "Solo founders needing a cleaner mark",
  },
  {
    id: "creative-reel",
    label: "Short-form edit",
    title: "Edit 3 short-form vertical reels",
    brief:
      "Cut 3 vertical clips (≤45s each) from provided footage with captions and light color grade. Deliver MP4s + thumbnail stills. Proof: shared drive folder and frame grabs.",
    amount: 150,
    category: "creative",
    priority: "high",
    tags: ["video", "social", "deliverables"],
    audience: "Creators batching content for the week",
  },
  {
    id: "creative-copy",
    label: "Landing copy",
    title: "Landing page copy rewrite (hero + 3 sections)",
    brief:
      "Rewrite hero, features, and CTA sections for a single landing page. Deliver Google Doc with before/after and a 5-bullet rationale. Proof: shared doc link + word count.",
    amount: 175,
    category: "creative",
    priority: "normal",
    tags: ["copywriting", "remote", "deliverables"],
    audience: "Indie makers polishing a launch page",
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
    tags: ["recurring-candidate", "outdoor", "yard"],
    audience: "Neighbors hiring seasonal help",
  },
  {
    id: "other-dogwalk",
    label: "Dog walk",
    title: "45-minute dog walk + photo check-in",
    brief:
      "Walk dog for 45 minutes on the usual neighborhood route. Provide fresh water on return. Send timestamped outdoor photo mid-walk and return-home photo.",
    amount: 30,
    category: "other",
    priority: "normal",
    tags: ["pets", "same-day"],
    audience: "Pet owners stuck in meetings",
  },
  {
    id: "other-errands",
    label: "Errand run",
    title: "Grocery + pharmacy errand run",
    brief:
      "Shop provided grocery + pharmacy list (budget ≤$120, reimbursed separately). Deliver bags to door. Photo of receipt total and bags at doorstep.",
    amount: 40,
    category: "other",
    priority: "high",
    tags: ["errands", "same-day"],
    audience: "People who need a trusted runner today",
  },
  {
    id: "other-ikea",
    label: "Flat-pack build",
    title: "Assemble IKEA dresser + nightstand",
    brief:
      "Assemble one dresser and one nightstand from flat-pack. Bag leftover hardware. Photo of finished pieces, empty box pile, and hardware bag.",
    amount: 100,
    category: "other",
    priority: "normal",
    tags: ["assembly", "furniture"],
    audience: "Anyone who dreads the hex key",
  },
];

export function getTemplateById(id: string | null | undefined) {
  if (!id) return undefined;
  return JOB_TEMPLATES.find((t) => t.id === id);
}

export function searchTemplates(
  query: string,
  category: JobCategory | "all" = "all",
) {
  const q = query.trim().toLowerCase();
  return JOB_TEMPLATES.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (!q) return true;
    const hay = [
      t.title,
      t.label,
      t.brief,
      t.audience,
      t.category,
      ...t.tags,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
