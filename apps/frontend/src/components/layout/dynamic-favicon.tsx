"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export function DynamicFavicon() {
    const [faviconUrl, setFaviconUrl] = useState("/favicon.ico");

    useEffect(() => {
        // Busca aparência atualizada
        api.get("/settings/appearance")
            .then(res => {
                if (res.data?.faviconId) {
                    setFaviconUrl(`/api/media/public-media/${res.data.faviconId}`);
                }
            })
            .catch(() => null);
    }, []);

    return (
        <link rel="icon" href={faviconUrl} />
    );
}
