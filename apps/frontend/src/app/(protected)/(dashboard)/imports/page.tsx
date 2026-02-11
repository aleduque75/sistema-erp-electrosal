"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegacyImport } from "./components/LegacyImport";
import { OfxImport } from "./components/OfxImport";
import { BackupManager } from "@/components/backups/BackupManager";

export default function ImportPage() {
  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="legacy">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="legacy">Importação Legado</TabsTrigger>
          <TabsTrigger value="ofx">Importação OFX</TabsTrigger>
          <TabsTrigger value="backups">Gerenciamento de Backups</TabsTrigger>
        </TabsList>
        <TabsContent value="legacy">
          <LegacyImport />
        </TabsContent>
        <TabsContent value="ofx">
          <OfxImport />
        </TabsContent>
        <TabsContent value="backups">
          <BackupManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}