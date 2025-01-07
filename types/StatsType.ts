export type ClickType = "phone" | "email" | "website" | "adress" | "company";

export interface StatsType {
    clickType: ClickType,
    companyId: string,
    timestamp: number
}