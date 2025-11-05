export interface Reference {
    id: string,
    comanyName: string,
    website: string,
    companyBranch: string,
    logoUrl: string,
    thumbnailUrl: string,
    description: string,
    public: boolean,
    sections?: ReferenceSection[]
}

export interface ReferenceSection  {
    title: string,
    link?: string,
    imagePath: string,
    text: string
}