import { gql } from 'graphql-request';

export const GET_ALL_PROJECTS = gql`
  query GetAllProjects {
    projects(first: 100, orderBy: createdAt, orderDirection: desc) {
      id
      name
      description
      metadataURI
      sponsor
      category
      status
      fundingGoal
      fundingRaised
      bondPrice
      projectedAPY
      createdAt
      imageUrl
      revenueModel
      location {
        id
        country
        region
        latitude
        longitude
      }
      bondToken {
        id
        symbol
        totalSupply
      }
      market {
        id
        question
        yesPrice
        noPrice
        totalVolume
        resolved
      }
      milestones {
        id
        index
        description
        targetDate
        completed
        completedAt
        evidenceURI
      }
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      metadataURI
      sponsor
      category
      status
      fundingGoal
      fundingRaised
      bondPrice
      projectedAPY
      createdAt
      imageUrl
      revenueModel
      location {
        id
        country
        region
        latitude
        longitude
      }
      bondToken {
        id
        symbol
        totalSupply
      }
      market {
        id
        question
        yesPrice
        noPrice
        yesPool
        noPool
        totalVolume
        resolved
        outcome
      }
      milestones {
        id
        index
        description
        targetDate
        completed
        completedAt
        evidenceURI
      }
    }
  }
`;

export const GET_ALL_MARKETS = gql`
  query GetAllMarkets {
    markets(first: 100, orderBy: createdAt, orderDirection: desc) {
      id
      question
      yesPrice
      noPrice
      yesPool
      noPool
      totalVolume
      resolved
      outcome
      createdAt
      project {
        id
        name
        category
      }
      trades(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        trader
        isYes
        isBuy
        amount
        cost
        timestamp
      }
    }
  }
`;

export const GET_MARKET = gql`
  query GetMarket($id: ID!) {
    market(id: $id) {
      id
      question
      yesPrice
      noPrice
      yesPool
      noPool
      totalVolume
      resolved
      outcome
      createdAt
      resolvedAt
      project {
        id
        name
        category
        status
      }
      trades(orderBy: timestamp, orderDirection: desc) {
        id
        trader
        isYes
        isBuy
        amount
        cost
        timestamp
      }
    }
  }
`;

export const GET_MARKET_BY_PROJECT = gql`
  query GetMarketByProject($projectId: ID!) {
    markets(where: { project: $projectId }) {
      id
      question
      yesPrice
      noPrice
      yesPool
      noPool
      totalVolume
      resolved
      outcome
      createdAt
      project {
        id
        name
        category
        status
      }
    }
  }
`;

export const GET_PLATFORM_STATS = gql`
  query GetPlatformStats {
    projects(first: 1000) {
      id
      status
      fundingRaised
      projectedAPY
    }
    markets(first: 1000) {
      id
      totalVolume
      resolved
    }
    bondHolders(first: 1000) {
      id
      holder
    }
  }
`;

export const GET_BOND_HOLDERS = gql`
  query GetBondHolders($projectId: String!) {
    bondHolders(where: { project: $projectId }) {
      id
      holder
      balance
      lastActivity
    }
  }
`;

export const GET_USER_BOND_HOLDINGS = gql`
  query GetUserBondHoldings($holder: Bytes!) {
    bondHolders(where: { holder: $holder }) {
      id
      project
      balance
      lastActivity
      bondToken {
        id
        symbol
        project {
          id
          name
          status
          projectedAPY
        }
      }
    }
  }
`;

export const GET_MILESTONES = gql`
  query GetMilestones($projectId: String!) {
    milestones(where: { project: $projectId }, orderBy: index, orderDirection: asc) {
      id
      index
      description
      targetDate
      completed
      completedAt
      evidenceURI
    }
  }
`;
