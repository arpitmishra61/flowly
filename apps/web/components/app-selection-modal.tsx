"use client"

import { ChessKing, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Action, App, Trigger } from "@/lib/types"
import { useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"

const API = "http://localhost:5000"
interface AppSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectApp: (app: App) => void
  title?: string
}

export function AppSelectionModal({
  open,
  onOpenChange,
  onSelectApp,
  title = "Choose an app"
}: AppSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [actions, setActions] = useState<Trigger[] | null>(null)
  const [triggers, setTriggers] = useState<Action[] | null>(null)
  useEffect(() => {
    Promise.all([axios.get<Trigger[]>(`${API}/api/v1/triggers`), axios.get<Action[]>(`${API}/api/v1/actions`)]).then(([triggersRes, actionsRes]) => {

      setActions(actionsRes.data)
      setTriggers(triggersRes.data)
    }).catch(err => {
      console.log(err)
    })

  }, [])

  const filteredApps = triggers ? triggers.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  const handleSelectApp = (app: App) => {
    onSelectApp(app)
    onOpenChange(false)
    setSearchQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {filteredApps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleSelectApp(app)}
                className={`group flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left active:scale-95 ${app.disabled ? 'opacity-35 pointe:Apps-none' : ''}`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `white` }}
                >
                  <Image src={app.imageUrl} height={50} width={50} alt={app.name} />
                </div>
                <span className="font-medium text-sm flex-1">{app.name}</span>
              </button>
            ))}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No apps found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
