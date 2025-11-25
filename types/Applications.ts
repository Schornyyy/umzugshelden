export interface Application {
    id: string,
    ownerId: string,
    name: string,
    email: string, 
    phone?: string,
    message: string,
    status: 'pending' | 'in_review' | 'accepted' | 'rejected',
    createdAt: number,
    updatedAt: number,
    jobTitel: string,
    notes: ApplicationNote[],
    files: string[],
    availableAt: string,
    salary: string,
}

export interface ApplicationNote {
    titel: string,
    msg: string,
    createdAt: number,
}