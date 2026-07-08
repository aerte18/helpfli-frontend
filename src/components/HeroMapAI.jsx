const LANDING_HERO_VERSION = "20260523c";

export default function HeroMapAI() {
  return (
    <div className="hidden lg:flex relative w-full ml-auto justify-end -mr-4 sm:-mr-6 md:-mr-8">
      <div
        className="relative w-full max-w-[560px] xl:max-w-[640px] flex items-center justify-end"
        style={{
          minHeight: "400px",
          height: "clamp(380px, 42vh, 480px)",
        }}
      >
        <img
          src={`/img/landing%20front.png?v=${LANDING_HERO_VERSION}`}
          alt="Znajdź pomoc w swojej okolicy — mapa usług Helpfli"
          className="block h-full w-full max-w-none object-contain object-right select-none scale-[1.06] origin-right"
          style={{ objectPosition: "right center" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
