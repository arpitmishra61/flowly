// components/flow-canvas.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TriggerModal } from "./TriggerModal"

export function FlowCanvas() {
    const [open, setOpen] = useState(false)

    return (
        <main className="flex-1 flex flex-col items-center justify-center bg-muted/30">
            <div className="space-y-6">

                {/* Trigger */}
                <div className="border rounded-lg p-6 bg-background text-center">
                    <p className="text-sm text-muted-foreground mb-2">Trigger</p>
                    <Button onClick={() => setOpen(true)}>
                        Choose Trigger
                    </Button>
                </div>

                {/* Action */}
                <div className="border rounded-lg p-6 bg-background text-center">
                    <p className="text-sm text-muted-foreground mb-2">Action</p>
                    <Button variant="outline">
                        + Add Action
                    </Button>
                </div>
            </div>

            <TriggerModal open={open} setOpen={setOpen} />
        </main>
    )
}
