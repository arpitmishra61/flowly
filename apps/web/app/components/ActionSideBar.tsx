// components/action-sidebar.tsx
import { Button } from "@/components/ui/button"

export function ActionSidebar() {
    return (
        <aside className="w-72 border-l p-4">
            <h2 className="font-semibold mb-4">Actions</h2>

            <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                    📧 Send Email
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                    💬 GitHub Comment
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                    🔗 Webhook Call
                </Button>
            </div>
        </aside>
    )
}
