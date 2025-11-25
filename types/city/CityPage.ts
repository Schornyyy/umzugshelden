import { CityFAQ } from "./CityFAQType";
import { CityPageSection } from "./CityPageSection";

export interface CityPage {
    ownerId: string,
    city: string,
    id: string,
    faq: CityFAQ[],
    title?: string,
    description?: string,
    sections?: CityPageSection[]
}