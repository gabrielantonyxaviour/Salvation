// Subgraph configuration
// The URL is hardcoded here for reliability in both client and server contexts

export const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.goldsky.com/api/public/project_cmemwacolly2301xs17yy3d6z/subgraphs/salvation/1.0.3/gn';

export const FALLBACK_SUBGRAPH_URL = 'http://localhost:8000/subgraphs/name/salvation';
