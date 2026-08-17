import GoogleConnectCard from "./GoogleConnectCard";
import DateFilterCard from "./DateFilterCard";
import ExportSelectionPanel from "./ExportSelectionPanel";

export default function SettingsPanel() {
  return (
    <section className="settingsPanel section my-6 flex flex-col gap-3">
      <GoogleConnectCard />
      <DateFilterCard />
      <ExportSelectionPanel />
    </section>
  );
}
