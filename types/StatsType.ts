export type ClickType = "phone" | "email" | "website" | "adress";

export interface StatsType {
    clickType: ClickType,
    companyId: string,
    timestamp: number
}