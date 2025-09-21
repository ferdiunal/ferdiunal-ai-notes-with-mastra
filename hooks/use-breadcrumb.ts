import { create } from 'zustand'

interface BreadcrumbStore {
  breadcrumb: string
  setBreadcrumb: (breadcrumb: string) => void
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  breadcrumb: "",
  setBreadcrumb: (breadcrumb: string) => set({ breadcrumb }),
}))
