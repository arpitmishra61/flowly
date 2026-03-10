"use client"

import { Plus, MoreVertical, AlertCircle } from "lucide-react"
import { ZapNode as ZapNodeType } from "@/lib/types"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ZapNodeProps {
  node: ZapNodeType
  onConfigure: () => void
  isFirst?: boolean
}

export function ZapNode({ node, onConfigure, isFirst }: ZapNodeProps) {
  const isConfigured = node.app !== null

  return (
    <div className="relative">
      {!isFirst && (
        <div className="flex justify-center">
          <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-gray-200" />
        </div>
      )}

      <div
        onClick={onConfigure}
        className={cn(
          "relative border-2 rounded-2xl p-5 transition-all duration-200 cursor-pointer group",
          isConfigured
            ? "bg-white border-gray-200 hover:border-primary hover:shadow-lg"
            : "bg-white border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
        )}
      >
        {!isConfigured && (
          <div className="absolute -top-3 left-4 px-2 bg-white">
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <p>Please create this {isFirst ? "event" : "action"} to add more actions</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isConfigured && node.app ? (
            <>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0 transition-transform group-hover:scale-110"
              >
                <Image src={node.app.imageUrl} height={50} width={50} alt="logo" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    {node.type === 'trigger' ? 'Trigger' : 'Action'}
                  </span>
                </div>
                <h3 className="font-semibold text-base mb-1 truncate">{node.app.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {node.type === 'trigger' ? 'Select the event' : 'Configure action'}
                </p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-primary transition-colors">
                <Plus className="h-6 w-6 text-gray-400 group-hover:text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-0.5">
                  {node.type === 'trigger' ? 'Select the event' : 'Select the action'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose an app to {node.type === 'trigger' ? 'trigger' : 'perform'} this Zap
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
