const LANDING_HERO_VERSION = "20260523b";

export default function HeroMapAI() {
  return (
    <div className="hidden lg:flex relative w-full max-w-[540px] xl:max-w-[600px] ml-auto justify-end">
      <div
        className="relative w-full rounded-3xl overflow-hidden flex items-center justify-center"
        style={{
          minHeight: "400px",
          height: "clamp(380px, 42vh, 480px)",
          background:
            "linear-gradient(to bottom right, oklch(from var(--primary) l c h / 0.08), var(--secondary), oklch(from var(--accent) l c h / 0.12))",
        }}
      >
        <img
          src={`/img/landing%20front.png?v=${LANDING_HERO_VERSION}`}
          alt="Znajdź pomoc w swojej okolicy — mapa usług Helpfli"
          className="block w-[118%] h-[118%] max-w-none object-contain object-center select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
