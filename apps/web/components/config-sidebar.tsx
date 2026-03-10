"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ZapNode } from "@/lib/types"
import { ChevronRight } from "lucide-react"
import Image from "next/image"

interface ConfigSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  node: ZapNode | null
  onSave: (config: Record<string, any>) => void
  onConfigure: () => void
}

export function ConfigSidebar({ open, onOpenChange, node, onSave, onConfigure }: ConfigSidebarProps) {
  const handleSave = () => {
    onSave({
      event: node?.type === 'trigger' ? 'New File' : 'Create File',
      configured: true
    })
    onOpenChange(false)
  }

  if (!node?.app) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent onClose={() => onOpenChange(false)} side="right">
        <SheetHeader>
          <div className="flex items-center gap-3 pr-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"

            >
              <Image src={node.app.imageUrl} height={50} width={50} alt="logo" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-base">{node.app.name}</SheetTitle>

            </div>
          </div>
        </SheetHeader>

        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-y mt-6">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-primary font-medium text-sm">
            <span>Setup</span>
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground font-medium text-sm hover:bg-white transition-colors">
            <span>Test</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              App <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              >
                <Image src={node.app.imageUrl} height={50} width={50} alt="logo" />
              </div>
              <span className="font-medium text-sm">{node.app.name}</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={onConfigure}>
                Change
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {node.type === 'trigger' ? 'Trigger event' : 'Action event'} <span className="text-red-500">*</span>
            </label>
            <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Choose an event</option>
              {node.type === 'trigger' ? (
                <>
                  <option value="new-file">New File</option>
                  <option value="updated-file">Updated File</option>
                  <option value="new-folder">New Folder</option>
                </>
              ) : (
                <>
                  <option value="create-file">Create File</option>
                  <option value="upload-file">Upload File</option>
                  <option value="create-folder">Create Folder</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account</label>
            <div className="p-4 rounded-lg border border-dashed bg-blue-50 border-blue-200">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  i
                </div>
                <p className="text-sm text-gray-700">
                  You don't need to connect an account when creating a template.
                  You will be able to map values using the integrations default sample values.
                </p>
              </div>
            </div>
          </div>

          {node.type === 'action' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">File Name</label>
                <Input placeholder="Enter file name..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Folder</label>
                <Input placeholder="Select folder..." />
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-white">
          <Button onClick={handleSave} className="w-full" size="lg">
            Continue
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
