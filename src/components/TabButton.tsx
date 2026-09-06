import type { LucideIcon } from "lucide-react";

interface TabButtonProps {
  icon: LucideIcon;
  isActive: boolean;
  label: string;
  onClick: () => void;
}

export function TabButton({ icon: Icon, isActive, label, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      className={`tab-button ${isActive ? "is-active" : ""}`}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
