export interface MediathekItem {
	ownerId: string,
	id: string;              // Firestore doc id
	url: string;             // Public download URL
	thumbUrl?: string;       // Thumbnail URL (can mirror url for now)
	name: string;            // Original file name (without path)
	alt?: string;            // Optional alt text
	contentType?: string;    // MIME type
	size?: number;           // Bytes
	width?: number;          // Image width (if detectable)
	height?: number;         // Image height (if detectable)
	createdAt: number;       // ms timestamp
	storagePath: string;     // Path in Firebase Storage (mediathek/...)
	tags?: string[];         // Optional tags/facets
}

export type NewMediathekUpload = {
	file: File;
	alt?: string;
};