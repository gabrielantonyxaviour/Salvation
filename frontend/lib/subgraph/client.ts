import { GraphQLClient } from 'graphql-request';
import { SUBGRAPH_URL } from './config';

export const subgraphClient = new GraphQLClient(SUBGRAPH_URL);
