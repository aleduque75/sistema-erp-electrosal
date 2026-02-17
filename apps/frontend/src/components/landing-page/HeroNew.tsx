"use client";

export function HeroNew({ config }: any) {
  const getImageUrl = (path: string | undefined | null): string => {
    if (!path || path === "undefined")
      return "/images/landing/banner-galvano.png";

    // Se for UUID, busca na porta 3001 com o prefixo configurado no main.ts
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        path,
      );

    if (isUUID) {
      // ✅ IMPORTANTE: Se o arquivo na pasta 'uploads' tiver extensão, adicione .png aqui
      return `http://localhost:3001/api/public-media/${path}`;
    }
    return path;
  };

  const slides = config?.slides || [];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {slides.map((slide: any, i: number) => (
        <div key={i} className="absolute inset-0">
          <img
            src={getImageUrl(slide.imageUrl)}
            className="w-full h-full object-cover"
            alt={slide.title}
            onError={(e) => {
              // Fallback caso o arquivo físico não tenha extensão ou o link falhe
              (e.target as HTMLImageElement).src =
                "/images/landing/banner-galvano.png";
            }}
          />
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
            <h1 className="text-5xl font-bold uppercase italic">
              {slide.title}
            </h1>
            <p className="text-xl">{slide.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
