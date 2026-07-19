"use client"

import { useCallback, useRef, useState } from "react"
import { Plus } from "lucide-react"
import { ZapNode } from "@/components/zap-node"
import { AppSelectionModal } from "@/components/app-selection-modal"
import { ConfigSidebar } from "@/components/config-sidebar"
import { Button } from "@/components/ui/button"
import { ZapNode as ZapNodeType, App } from "@/lib/types"
import { ActionsAtom, MetaDataAtom, PublishModalOpenAtom, SaveNodeAction, TriggerAtom } from "@/atoms"
import { ACTION_OUTPUT_KEYS } from "@/lib/actionOutputKeys"
import { flattenObject } from "@/lib/flattenObject"
import { getDefaultStore, useAtom, useSetAtom } from "jotai"
import { useSession } from "next-auth/react"

import axios from "axios"
import { PublishModal } from "./PublishModal"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"


export function ZapBuilder() {
  const { data: session } = useSession()
  const [nodes, setNodes] = useState<ZapNodeType[]>([
    { id: '1', type: 'trigger', app: null, configured: false }
  ])

  const [modalOpen, setModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarConfig, setSidebarConfig] = useState<[{ type: string, id: string, data: any }] | null>(null)
  const sidebarData = useRef<{ type: string, id: string, data: any } | null>(null)
  const setMetaData = useSetAtom(MetaDataAtom)
  const [publishModalOpen, setPublishModalOpen] = useAtom(PublishModalOpenAtom)

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [modalType, setModalType] = useState<'trigger' | 'action'>('trigger')
  const [triggerData, setTriggerData] = useAtom(TriggerAtom)
  const [actionData, setActionData] = useAtom(ActionsAtom)

  const currentNode = nodes.find(n => n.id === currentNodeId) || null

  const handleNodeClick = (nodeId: string, changeReq?: Boolean) => {
    const node = nodes.find(n => n.id === nodeId)
    console.log("dadad", node)
    if (!node) return

    setCurrentNodeId(nodeId)

    if (node.app && !changeReq) {
      // If app is already selected, open sidebar for configuration
      sidebarData.current = sidebarConfig?.find(config => config.id === nodeId) || null
      setSidebarOpen(true)
    } else {
      // Otherwise, open modal to select app
      setModalType(node.type)
      setModalOpen(true)
    }
    if (changeReq) {
      setSidebarOpen(false)

    }
  }

  const handleSelectApp = (app: App) => {
    if (!currentNodeId) return

    setNodes(nodes.map(node =>
      node.id === currentNodeId
        ? { ...node, app }
        : node
    ))

    // After selecting app, open sidebar for configuration
    console.log("app", app)
    setSidebarOpen(true)
  }

  const handleSaveConfig = useCallback((config: Record<string, any>) => {

    if (!currentNodeId) return

    setNodes(nodes => nodes.map(node =>
      node.id === currentNodeId
        ? { ...node, configured: true, config }
        : node
    ))

    // Keys available to this node's AutocompleteBox fields: the trigger's
    // sample payload, plus the known output shape of every action earlier
    // in the chain (an action can only reference what ran before it).
    const currentIndex = nodes.findIndex(node => node.id === currentNodeId)
    const jsonData = flattenObject(triggerData?.app?.metaData?.jsonData ?? {})
    const outputKeys: Record<string, string> = {}
    nodes.forEach((node, index) => {
      if (node.type !== 'action' || index >= currentIndex) return
      const keys = node.app?.name ? ACTION_OUTPUT_KEYS[node.app.name] : undefined
      keys?.forEach(key => { outputKeys[key] = key })
    })

    setMetaData(metaData => ({ ...metaData, ...jsonData, ...outputKeys }))

  }, [currentNodeId, nodes, triggerData?.app])


  const handleAddAction = () => {
    const newNode: ZapNodeType = {
      id: Date.now().toString(),
      type: 'action',
      app: null,
      configured: false
    }
    const previousNode = nodes.at(-1)

    if (previousNode?.configured === true) {
      setNodes([...nodes, newNode])
    }
  }

  const handleDeleteNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    if (node.type === 'trigger') {
      if (!confirm("Reset this trigger? You'll need to choose an app again.")) return
      setNodes(nodes => nodes.map(n =>
        n.id === nodeId ? { ...n, app: null, configured: false } : n
      ))
      setTriggerData(null)
    } else {
      if (!confirm("Delete this action?")) return
      setNodes(nodes => nodes.filter(n => n.id !== nodeId))
      setActionData(actions => actions?.filter(a => a?.id !== nodeId) ?? null)
    }

    if (currentNodeId === nodeId) {
      setCurrentNodeId(null)
      setSidebarOpen(false)
    }
  }
  const previousNode = nodes.at(-1)
  console.log("rer", currentNodeId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Page title */}
      <div className="border-b bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Zap Builder
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create automated workflows</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">Test run</Button>
            <Button onClick={() => {
              let url = `${API_URL}/api/v1/zap`
              console.log(triggerData, actionData)
              const data = {
                availableTriggerId: `${triggerData?.id}`,
                triggerMetadata: triggerData?.app?.metaData.jsonData,
                actions: actionData?.map(action => {
                  return {
                    availableActionId: action?.app?.id.toString(),
                    actionMetadata: action?.app?.metaData.jsonData
                  }
                }),
                userId: session?.user.id
              };
              console.log("data to send ", data)

              axios.post(url, data, {
              })
                .then(response => {
                  console.log("Success:", response.data);
                })
                .catch(error => {
                  console.error("Error:", error);
                });

              setPublishModalOpen(true)

            }}>Publish</Button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200/60">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              Z
            </div>
            <div>
              <h2 className="font-semibold text-lg">Untitled Zap</h2>
              <p className="text-sm text-muted-foreground">
                {nodes.filter(n => n.configured).length} of {nodes.length} steps configured
              </p>
            </div>
          </div>

          <div className="space-y-0">
            {nodes.map((node, index) => (
              <ZapNode
                key={node.id}
                node={node}
                onConfigure={() => handleNodeClick(node.id)}
                onDelete={() => handleDeleteNode(node.id)}
                isFirst={index === 0}
              />
            ))}

            {/* Add Action Button */}
            <div className="flex justify-center pt-8">
              <div className="w-0.5 h-8 bg-gradient-to-b from-gray-200 to-transparent" />
            </div>
            <div className="flex justify-center">
              <button
                disabled={!previousNode?.configured}
                onClick={handleAddAction}
                className="group flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 group-hover:border-primary flex items-center justify-center transition-colors">
                  <Plus className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Add action
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Build your automation by connecting triggers and actions
          </p>
        </div>
      </div>

      {/* Modals and Sidebars */}
      <AppSelectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSelectApp={handleSelectApp}
        actionId={modalType === "action" ? currentNodeId : null}
        title={modalType === 'trigger' ? 'Choose a trigger app' : 'Choose an action app'}
        modalType={modalType}
      />

      {sidebarOpen && <ConfigSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        node={currentNode}
        onSave={handleSaveConfig}
        sidebarData={sidebarData}
        setSidebarConfig={setSidebarConfig}
        onConfigure={() => handleNodeClick(currentNodeId ?? "", true)}
      />}
      <PublishModal
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
      />
    </div>
  )
}
