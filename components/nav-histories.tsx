"use client"

import {HistoryIcon} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { useHistoryQuery } from "@/hooks/useHistoryQuery"
import Head from "next/head"

export function NavHistories() {
  const pathname = usePathname()
  const { data: histories } = useHistoryQuery({
    limit: 10,
    ending_before: null,
  })

  return (
    <>
    <Head>
      <title>{histories?.chats[0].title}</title>
    </Head>
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>History</SidebarGroupLabel>
      <SidebarMenu>
        {histories?.chats.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild isActive={pathname.startsWith(`/c/${item.id}`)}>
              <Link href={`/c/${item.id}`}>
                <HistoryIcon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {/* <SidebarMenuItem>
          <SidebarMenuButton>
            <MoreHorizontal />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
      </SidebarMenu>
    </SidebarGroup>
    </>
  )
}
