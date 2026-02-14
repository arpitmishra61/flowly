// app/page.tsx
import { FlowSidebar } from "./components/FlowSidebar"
import { FlowCanvas } from "./components/FlowCanvas"
import { ActionSidebar } from "./components/ActionSideBar"
import { } from ""
export default function Home() {
  return (
    <div className="flex h-screen">
      <FlowSidebar />
      <FlowCanvas />
      <ActionSidebar />
    </div>
  )
}
