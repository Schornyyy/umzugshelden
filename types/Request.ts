export interface Request {
    id: string,
    ownerId: string,
    name: string, 
    email: string,
    createdAt: number,
    phone: string, 
    message: string,
    imageUrls: string[],
    notices: RequestNotice[],
}

export interface RequestNotice {
    titel: string,
    msg: string,
    createdAt: number
}