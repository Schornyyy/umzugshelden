export const GEMINI_EMBEDDING_DIMENSION = 3072;
export const PINECONE_DISTANCE_METRIC = "cosine";

export function buildPineconeIndexConfiguration(
  name: string,
  cloud = "aws",
  region = "us-east-1",
) {
  return {
    name,
    dimension: GEMINI_EMBEDDING_DIMENSION,
    metric: PINECONE_DISTANCE_METRIC,
    spec: {
      serverless: {
        cloud,
        region,
      },
    },
    deletion_protection: "disabled",
  } as const;
}
