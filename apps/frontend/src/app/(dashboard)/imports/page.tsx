"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegacyImport } from "./components/LegacyImport";
import { OfxImport } from "./components/OfxImport";
import { DataFixing } from "./components/DataFixing";

export default function ImportPage() {
  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="legacy">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="legacy">Importação Legado</TabsTrigger>
          <TabsTrigger value="ofx">Importação OFX</TabsTrigger>
          <TabsTrigger value="data-fixing">Manutenção de Dados</TabsTrigger>
        </TabsList>
        <TabsContent value="legacy">
          <LegacyImport />
        </TabsContent>
        <TabsContent value="ofx">
          <OfxImport />
        </TabsContent>
        <TabsContent value="data-fixing">
          <DataFixing />
        </TabsContent>
      </Tabs>
    </div>
  );
}