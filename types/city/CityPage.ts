import { CityFAQ } from "./CityFAQType";

export interface CityPage {
    city: string,
    id: string,
    faq: CityFAQ[]
}