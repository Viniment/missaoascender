import Dashboard from "./Dashboard";
import JejumCard from "@/components/JejumCard";
import UrgeSurfingCard from "@/components/UrgeSurfingCard";
import ConquistaJejumPopup from "@/components/ConquistaJejumPopup";

export default function DashboardComJejum() {
  return <>
    <Dashboard />
    <div className="space-y-4">
      <JejumCard />
      <UrgeSurfingCard />
    </div>
    <ConquistaJejumPopup />
  </>;
}
