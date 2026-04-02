"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", icon: "📊", label: "Home" },
  { href: "/insights", icon: "💡", label: "Insights" },
  { href: "/scan", icon: "📸", label: "Add" },
  { href: "/goals", icon: "🎯", label: "Goals" },
  { href: "/profile", icon: "👤", label: "Profile" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="nav-bar">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`nav-item${pathname === link.href ? " active" : ""}`}
        >
          <span className="nav-item-icon">{link.icon}</span>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
