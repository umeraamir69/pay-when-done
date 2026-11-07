import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function Icon({ size = 16, children, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `nav-icon ${className}` : "nav-icon"}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

export function IconRoute(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.2 17.2 15.8 6.8" />
    </Icon>
  );
}

export function IconLayout(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </Icon>
  );
}

export function IconPlusSquare(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </Icon>
  );
}

export function IconBriefcase(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12h18" />
    </Icon>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 8H20" />
    </Icon>
  );
}

export function IconHelp(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.3 1-1.3 1.9" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </Icon>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2" />
      <path d="M12 18.3v2.2" />
      <path d="M4.9 7.1 6.6 8.5" />
      <path d="M17.4 15.5 19.1 16.9" />
      <path d="M3.5 12h2.2" />
      <path d="M18.3 12h2.2" />
      <path d="M4.9 16.9 6.6 15.5" />
      <path d="M17.4 8.5 19.1 7.1" />
    </Icon>
  );
}

export function IconLogIn(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 17 15 12 10 7" />
      <path d="M15 12H3" />
      <path d="M21 21V3" />
    </Icon>
  );
}

export function IconLogOut(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 17 19 12 14 7" />
      <path d="M19 12H9" />
      <path d="M5 21V3" />
    </Icon>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5" />
      <path d="M5 16h14" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6z" />
    </Icon>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 13h7V4H4z" />
      <path d="M13 20h7v-9h-7z" />
      <path d="M13 11h7V4h-7z" />
      <path d="M4 20h7v-5H4z" />
    </Icon>
  );
}

export function IconLedger(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M10 9h6" />
      <path d="M10 13h6" />
      <path d="M10 17h4" />
    </Icon>
  );
}

export function IconInvoice(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3h10l3 3v15H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 3v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </Icon>
  );
}

export function IconPayout(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M9.5 9.5c.6-1 1.6-1.5 2.5-1.5 1.4 0 2.5.8 2.5 2s-1.1 2-2.5 2h-1c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2c.9 0 1.9-.5 2.5-1.5" />
    </Icon>
  );
}

export function IconWebhook(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 14a4 4 0 1 1-3.5-6" />
      <path d="M14 10a4 4 0 1 1 3.5 6" />
      <path d="M10 14a4 4 0 1 0 4 0" />
      <circle cx="12" cy="12" r="1.4" />
    </Icon>
  );
}

export function IconFeatures(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 14.2 8.8 20 9.2 15.6 13.2 17 19 12 15.8 7 19 8.4 13.2 4 9.2 9.8 8.8z" />
    </Icon>
  );
}

export function IconCode(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.5 6-3 12" />
    </Icon>
  );
}

export function IconHome(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </Icon>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </Icon>
  );
}

export type NavIconName =
  | "about"
  | "how"
  | "templates"
  | "create"
  | "jobs"
  | "docs"
  | "faq"
  | "account"
  | "settings"
  | "login"
  | "logout"
  | "alerts"
  | "admin"
  | "dashboard"
  | "ledger"
  | "invoices"
  | "payouts"
  | "webhooks"
  | "features"
  | "api"
  | "home"
  | "menu"
  | "close";

const iconMap: Record<NavIconName, ComponentType<IconProps>> = {
  about: IconInfo,
  how: IconRoute,
  templates: IconLayout,
  create: IconPlusSquare,
  jobs: IconBriefcase,
  docs: IconBook,
  faq: IconHelp,
  account: IconUser,
  settings: IconSettings,
  login: IconLogIn,
  logout: IconLogOut,
  alerts: IconBell,
  admin: IconShield,
  dashboard: IconDashboard,
  ledger: IconLedger,
  invoices: IconInvoice,
  payouts: IconPayout,
  webhooks: IconWebhook,
  features: IconFeatures,
  api: IconCode,
  home: IconHome,
  menu: IconMenu,
  close: IconClose,
};

export function NavIcon({
  name,
  ...props
}: IconProps & { name: NavIconName }) {
  const Comp = iconMap[name];
  return <Comp {...props} />;
}
