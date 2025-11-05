export interface AdminBlogCategory {
    categoryName: string;
    thumbnailUrl: string,
    id: string
}

export type AdminBlogMainCategory = "partner" | "seo" | "ratgeber" | "webdesign"

export interface AdminBlogPage {
    id: string,
    titel: string, 
    description: string,
    category: AdminBlogCategory,
    mainCategory: AdminBlogMainCategory,
    thumbnailUrl?: string,
    createdAt: number,
    updatedAt: number,
    keywords?: string[],
    meta_description?: string,
    sections: AdminBlogPageSection[],
    faq?: AdminBlogFAQSection[],
    visible: boolean
}

export interface AdminBlogPageSection {
    titel: string,
    image?: string,
    text: string,
    link?: string;
}

export interface AdminBlogFAQSection {
    question: string,
    answer: string
}