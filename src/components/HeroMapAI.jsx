export default function HeroMapAI() {
  return (
    <div className="hidden lg:block relative">
      <div className="rounded-3xl p-8 backdrop-blur-sm h-[340px] flex items-stretch overflow-hidden" style={{ background: 'linear-gradient(to bottom right, oklch(from var(--primary) l c h / 0.1), var(--secondary), oklch(from var(--accent) l c h / 0.2))' }}>
        <img
          src="/img/landing%20front.png"
          alt="Znajdź pomoc w swojej okolicy — mapa usług Helpfli"
          className="w-full h-full object-contain object-center rounded-2xl"
        />
      </div>
    </div>
  );
}

