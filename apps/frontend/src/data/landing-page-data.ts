
import { LandingPageData } from "@/config/landing-page";

export const LOCAL_LANDING_PAGE_DATA: LandingPageData = {
    id: "local-landing-page",
    name: "default",
    logoText: "Electrosal",
    logoImage: { id: "local-logo", path: "/images/logo.png", filename: "logo.png" }, // Adjusted to point to local file
    sections: [
        {
            order: 1,
            type: "hero",
            content: {
                title: "Excelência em Galvanoplastia e Gestão Inteligente",
                description:
                    "Oferecemos assessoria técnica especializada para otimizar seus banhos químicos e o sistema ERP definitivo para o controle total, da análise laboratorial ao financeiro.",
                mainImage: "/images/landing/banner-galvano.png", // Starting image
                sideImages: [
                    "/images/landing/banner-lab.png",
                    "/images/landing/banner-dashboard.png"
                ],
                ctaButtonText: "Fale com um Especialista",
                ctaButtonLink: "/contato",
                secondaryButtonText: "Conheça o Sistema",
                secondaryButtonLink: "#features",
            },
        },
        {
            order: 2,
            type: "features",
            content: {
                title: "Nossos Serviços e Soluções",
                description:
                    "Combinamos expertise técnica em processos galvânicos com tecnologia de ponta para alavancar sua indústria.",
                items: [
                    {
                        icon: "FlaskConical", // Represents Lab/Chemicals
                        title: "Assessoria Técnica",
                        description:
                            "Análise e correção de banhos, otimização de processos e consultoria especializada para garantir a máxima qualidade em seus acabamentos.",
                    },
                    {
                        icon: "Settings", // Represents Maintenance/Engineering
                        title: "Manutenção de Banhos",
                        description:
                            "Protocolos de manutenção preventiva e corretiva, controle de anodos e filtros, garantindo a estabilidade e eficiência da sua linha de produção.",
                    },
                    {
                        icon: "LayoutDashboard", // Represents Software/System
                        title: "Sistema ERP Electrosal",
                        description:
                            "Gestão completa: Controle de estoque químico, ordens de serviço, financeiro e emissão de laudos, tudo integrado em uma plataforma moderna.",
                    },
                ],
            },
        },
    ],
};
