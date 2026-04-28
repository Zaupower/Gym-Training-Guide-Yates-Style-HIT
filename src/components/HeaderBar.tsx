import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function HeaderBar({
  title,
  subtitle,
  userName,
}: {
  title: string;
  subtitle?: string;
  userName?: string;
}) {
  return (
    <header className="mb-4 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          <Link href="/">{title}</Link>
        </h1>
        {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
      </div>
      {userName && (
        <div className="flex items-center gap-2 text-xs text-ink/60">
          <span className="hidden sm:inline">{userName}</span>
          <LogoutButton />
        </div>
      )}
    </header>
  );
}
