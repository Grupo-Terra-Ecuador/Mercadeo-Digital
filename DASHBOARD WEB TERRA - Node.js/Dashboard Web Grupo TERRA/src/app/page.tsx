import DashboardShell from "@/components/dashboard/DashboardShell";
import Hero from "@/components/dashboard/Hero";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import ModuleAccordion from "@/components/dashboard/ModuleAccordion";
import ResumenSection from "@/components/sections/ResumenSection";
import TraficoSection from "@/components/sections/TraficoSection";
import UsuariosSection from "@/components/sections/UsuariosSection";
import AudienciasSection from "@/components/sections/AudienciasSection";
import PaginasSection from "@/components/sections/PaginasSection";
import TecnologiaSection from "@/components/sections/TecnologiaSection";
import OrganicoSection from "@/components/sections/OrganicoSection";
import DemografiaSection from "@/components/sections/DemografiaSection";
import ValidacionSection from "@/components/sections/ValidacionSection";
import FileCardsSection from "@/components/sections/FileCardsSection";

export default function Home() {
  return (
    <DashboardShell>
      <Hero />
      <SettingsPanel />

      <ModuleAccordion id="resumen" title="Resumen tecnico" defaultOpen>
        <ResumenSection />
      </ModuleAccordion>

      <ModuleAccordion id="trafico" title="Adquisicion de trafico web por canales" defaultOpen>
        <TraficoSection />
      </ModuleAccordion>

      <ModuleAccordion id="usuarios" title="Adquisicion de usuarios y fuentes de trafico" defaultOpen>
        <UsuariosSection />
      </ModuleAccordion>

      <ModuleAccordion id="audiencias" title="Audiencias">
        <AudienciasSection />
      </ModuleAccordion>

      <ModuleAccordion id="paginas" title="Paginas mas visitadas">
        <PaginasSection />
      </ModuleAccordion>

      <ModuleAccordion id="tecnologia" title="Tecnologia, dispositivos y navegadores">
        <TecnologiaSection />
      </ModuleAccordion>

      <ModuleAccordion id="organico" title="Consultas de busqueda organica">
        <OrganicoSection />
      </ModuleAccordion>

      <ModuleAccordion id="demografia" title="Demografia">
        <DemografiaSection />
      </ModuleAccordion>

      <ModuleAccordion id="validacion" title="Validacion tecnica">
        <ValidacionSection />
      </ModuleAccordion>

      <ModuleAccordion id="fuentes-dashboard" title="Registro de reportes procesados">
        <FileCardsSection />
      </ModuleAccordion>
    </DashboardShell>
  );
}
