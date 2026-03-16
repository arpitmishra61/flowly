"use client"
import { ZapBuilder } from "@/components/zap-builder"
import { Provider } from "jotai"

export default function Home() {
  return <Provider>
    <ZapBuilder />
  </Provider>
}
