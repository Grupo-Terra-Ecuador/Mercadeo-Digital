import GoogleConnectCard from "./GoogleConnectCard";
import DateFilterCard from "./DateFilterCard";
import ExportSelectionPanel from "./ExportSelectionPanel";

export default function SettingsPanel() {
  return (
    <section className="settingsPanel section my-6 flex flex-col gap-3">
      <div className="card rounded-terra border border-border bg-surface p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
        <GoogleConnectCard />
        <DateFilterCard />
      </div>
      <ExportSelectionPanel />
    </section>
  );
}
