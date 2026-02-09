"use client"

import * as React from "react"
import useEmblaCarousel from "embla-carousel-react" // Importa APENAS o hook

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// 1. Inferir os tipos diretamente do hook para evitar conflitos de exportação:
type UseEmblaCarouselType = ReturnType<typeof useEmblaCarousel>;
type EmblaOptionsType = Parameters<typeof useEmblaCarousel>[0];
type EmblaCarouselType = UseEmblaCarouselType[1]; // A instância real da API

// Agora todos os tipos estão resolvidos internamente

// O restante do código usa os tipos corrigidos:
type CarouselProps = {
  // Usa o tipo inferido
  opts?: EmblaOptionsType
  plugins?: any[] // Adicionado suporte a plugins
  orientation?: "horizontal" | "vertical"
  setApi?: (api: EmblaCarouselType) => void // Usa o tipo de instância
} & React.ComponentPropsWithoutRef<"div">

type CarouselContextProps = {
  // 3. CORREÇÃO: O emblaApi real retornado do hook é o EmblaCarouselType
  emblaApi: EmblaCarouselType | undefined
  canScrollPrev: boolean
  canScrollNext: boolean
  scrollPrev: () => void
  scrollNext: () => void
  selectedIndex: number
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & CarouselProps
>(
  (
    {
      opts,
      plugins,
      orientation = "horizontal",
      setApi,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Uso do tipo opts: EmblaOptionsType
    const [emblaRef, emblaApi] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(0)

    // CORREÇÃO: Usar 'any' para contornar a falha de tipagem externa
    const onSelect = React.useCallback(
      (emblaApi: any) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      },
      []
    );

    const scrollPrev = React.useCallback(() => {
      emblaApi?.scrollPrev()
    }, [emblaApi])

    const scrollNext = React.useCallback(() => {
      emblaApi?.scrollNext()
    }, [emblaApi])

    // CORREÇÃO: Usar 'any' para contornar a falha de tipagem externa
    const onInit = React.useCallback(
      (emblaApi: any) => {
        setCanScrollPrev(emblaApi.canScrollPrev())
        setCanScrollNext(emblaApi.canScrollNext())
      },
      []
    )

    // CORREÇÃO: Usar 'any' para contornar a falha de tipagem externa
    const onReInit = React.useCallback(
      (emblaApi: any) => {
        setCanScrollPrev(emblaApi.canScrollPrev())
        setCanScrollNext(emblaApi.canScrollNext())
      },
      []
    )

    React.useEffect(() => {
      if (!emblaApi) {
        return
      }

      emblaApi.on("init", onInit)
      emblaApi.on("select", onSelect)
      emblaApi.on("reInit", onReInit)
      emblaApi.on("settle", onInit)

      // Passar a instância emblaApi (que é UseEmblaCarouselType | undefined)
      // para inicialização manual.
      if (emblaApi) {
        onInit(emblaApi);
        onSelect(emblaApi);
      }

      if (setApi) {
        setApi(emblaApi)
      }

      return () => {
        emblaApi.off("init", onInit)
        emblaApi.off("select", onSelect)
        emblaApi.off("reInit", onReInit)
        emblaApi.off("settle", onInit)
      }
    }, [emblaApi, onInit, onReInit, onSelect, setApi])

    return (
      <CarouselContext.Provider
        value={{
          emblaApi,
          canScrollPrev,
          canScrollNext,
          scrollPrev,
          scrollNext,
          selectedIndex,
          opts,
          orientation,
        }}
      >
        <div
          ref={ref}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          <div
            ref={emblaRef}
            className="overflow-hidden"
            data-orientation={orientation}
          >
            <div
              className={cn(
                "flex",
                orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col"
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
        className
      )}
      {...props}
    />
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      onClick={scrollNext}
      disabled={!canScrollNext}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};