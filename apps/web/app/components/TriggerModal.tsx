// components/trigger-modal.tsx
"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function TriggerModal({ open, setOpen }: any) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Trigger</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3">
                    <Button variant="outline">GitHub</Button>
                    <Button variant="outline">Webhook</Button>
                    <Button variant="outline">Email</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
