import React from "react";
import Link from "next/link";

export default function Sidebar() {
  const menuItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Repositories", path: "/repositories" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white h-[calc(100vh-4rem)] flex flex-col p-4 gap-2">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
