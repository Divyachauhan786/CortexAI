import {
    QdrantClient,
} from "@qdrant/js-client-rest";

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
});

export default qdrant;