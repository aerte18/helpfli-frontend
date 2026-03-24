import Logo from "./Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#0B2B4A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Logo className="h-6 w-6" showText={true} textColor="text-white" clickable={true} />
        
        <nav className="flex items-center gap-3">
          <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">Konto</button>
          <button className="rounded-md bg-white px-3 py-1.5 text-sm text-[#0B2B4A]">Wyloguj</button>
        </nav>
      </div>
    </header>
  );
}
