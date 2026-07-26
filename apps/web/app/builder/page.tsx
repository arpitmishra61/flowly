"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ZapBuilder } from "@/components/zap-builder"
import { Provider } from "jotai"

function BuilderContent() {
  const searchParams = useSearchParams()
  const zapId = searchParams.get("id")

  return <Provider>
    <ZapBuilder zapId={zapId} />
  </Provider>
}

export default function Home() {
  return <Suspense>
    <BuilderContent />
  </Suspense>
}
