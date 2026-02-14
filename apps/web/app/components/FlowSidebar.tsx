// components/flow-sidebar.tsx
import { Button } from "@/components/ui/button"

export function FlowSidebar() {
    return (
        <aside className="w-64 border-r p-4">
            <h2 className="font-semibold mb-4">Flows</h2>

            <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                    GitHub → Email
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                    Webhook → Slack
                </Button>
            </div>

            <Button className="w-full mt-6">+ New Flow</Button>
        </aside>
    )
}
