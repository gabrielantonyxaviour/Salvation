/**
 * Subgraph Testing Script
 *
 * Tests connectivity and data integrity of the Salvation subgraph.
 * Run with: npx tsx scripts/test-subgraph.ts
 */

import { GraphQLClient } from 'graphql-request';

const SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cmemwacolly2301xs17yy3d6z/subgraphs/salvation/1.0.1/gn';

const client = new GraphQLClient(SUBGRAPH_URL);

const GET_ALL_PROJECTS = `
  query GetAllProjects {
    projects(first: 20, orderBy: createdAt, orderDirection: desc) {
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
        index
        description
        completed
      }
    }
  }
`;

const GET_ALL_MARKETS = `
  query GetAllMarkets {
    markets(first: 20) {
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
      trades(first: 5, orderBy: timestamp, orderDirection: desc) {
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

const GET_PLATFORM_STATS = `
  query GetPlatformStats {
    _meta {
      block { number }
      hasIndexingErrors
    }
    projects {
      id
      status
      fundingRaised
      projectedAPY
    }
    markets {
      id
      resolved
      totalVolume
    }
    bondHolders {
      id
      holder
    }
  }
`;

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  warning?: string;
}

const results: TestResult[] = [];

function log(name: string, passed: boolean, details?: string, warning?: string) {
  results.push({ name, passed, details, warning });
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${details}`);
  if (warning) console.log(`   ⚠️  ${warning}`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('SALVATION SUBGRAPH TEST');
  console.log('='.repeat(60));
  console.log(`\nEndpoint: ${SUBGRAPH_URL}\n`);

  try {
    // Test 1: Basic connectivity and sync status
    console.log('--- Connectivity & Sync ---\n');

    const statsData = await client.request(GET_PLATFORM_STATS) as any;
    const meta = statsData._meta;

    log(
      'Subgraph connectivity',
      true,
      `Block: ${meta.block.number}`
    );

    log(
      'No indexing errors',
      !meta.hasIndexingErrors,
      meta.hasIndexingErrors ? 'Has indexing errors!' : 'Clean'
    );

    // Test 2: Projects data
    console.log('\n--- Projects ---\n');

    const projectsData = await client.request(GET_ALL_PROJECTS) as any;
    const projects = projectsData.projects;

    log(
      'Projects indexed',
      projects.length > 0,
      `${projects.length} projects found`
    );

    // Check for projects with proper metadata
    const projectsWithNames = projects.filter((p: any) => p.name && p.name !== 'null');
    log(
      'Projects have names (IPFS metadata)',
      projectsWithNames.length > 0,
      `${projectsWithNames.length}/${projects.length} have names`,
      projectsWithNames.length < projects.length ? `${projects.length - projectsWithNames.length} missing names` : undefined
    );

    // Check categories
    const categories = new Set(projects.map((p: any) => p.category).filter(Boolean));
    log(
      'Project categories populated',
      categories.size > 0,
      `Categories: ${Array.from(categories).join(', ')}`
    );

    // Check funding data
    const projectsWithFunding = projects.filter((p: any) => Number(p.fundingRaised) > 0);
    log(
      'Projects have funding data',
      projectsWithFunding.length > 0,
      `${projectsWithFunding.length} projects have raised funds`
    );

    // Display project details
    console.log('\n   Project Details:');
    for (const p of projects.slice(0, 10)) {
      const name = p.name || 'UNNAMED';
      const category = p.category || 'N/A';
      const raised = Number(p.fundingRaised) / 1e6;
      const goal = Number(p.fundingGoal) / 1e6;
      const pct = goal > 0 ? ((raised / goal) * 100).toFixed(0) : '0';
      console.log(`   - ${name} (${category}): $${raised.toFixed(0)}/$${goal.toFixed(0)} (${pct}%)`);
    }

    // Test 3: Bond tokens
    console.log('\n--- Bond Tokens ---\n');

    const projectsWithBonds = projects.filter((p: any) => p.bondToken);
    log(
      'Bond tokens linked to projects',
      projectsWithBonds.length > 0,
      `${projectsWithBonds.length} projects have bond tokens`
    );

    // Test 4: Markets
    console.log('\n--- Prediction Markets ---\n');

    const marketsData = await client.request(GET_ALL_MARKETS) as any;
    const markets = marketsData.markets;

    log(
      'Markets indexed',
      markets.length > 0,
      `${markets.length} markets found`
    );

    // Check market-project links
    const marketsWithProjects = markets.filter((m: any) => m.project?.id);
    log(
      'Markets linked to projects',
      marketsWithProjects.length === markets.length,
      `${marketsWithProjects.length}/${markets.length} linked`
    );

    // Check price data
    const validPrices = markets.filter((m: any) =>
      parseFloat(m.yesPrice) >= 0 && parseFloat(m.yesPrice) <= 1
    );
    log(
      'Market prices valid (0-1 range)',
      validPrices.length === markets.length,
      `${validPrices.length}/${markets.length} valid`
    );

    // Display market details
    console.log('\n   Market Details:');
    for (const m of markets.slice(0, 8)) {
      const question = m.question?.slice(0, 50) || 'No question';
      const yes = (parseFloat(m.yesPrice) * 100).toFixed(0);
      const no = (parseFloat(m.noPrice) * 100).toFixed(0);
      console.log(`   - ${question}... YES: ${yes}% / NO: ${no}%`);
    }

    // Test 5: Milestones
    console.log('\n--- Milestones ---\n');

    const projectsWithMilestones = projects.filter((p: any) => p.milestones?.length > 0);
    const totalMilestones = projects.reduce((sum: number, p: any) => sum + (p.milestones?.length || 0), 0);
    log(
      'Milestones indexed',
      totalMilestones > 0,
      `${totalMilestones} milestones across ${projectsWithMilestones.length} projects`
    );

    // Test 6: Platform Stats Summary
    console.log('\n--- Platform Stats ---\n');

    const totalFunding = projects.reduce(
      (sum: number, p: any) => sum + Number(p.fundingRaised) / 1e6,
      0
    );
    console.log(`   Total Funding Raised: $${totalFunding.toFixed(2)}`);

    const activeProjects = projects.filter((p: any) => p.status === 'active').length;
    const fundingProjects = projects.filter((p: any) => p.status === 'funding').length;
    console.log(`   Active Projects: ${activeProjects}`);
    console.log(`   Funding Projects: ${fundingProjects}`);
    console.log(`   Total Markets: ${markets.length}`);

    const uniqueHolders = new Set(statsData.bondHolders?.map((h: any) => h.holder) || []);
    console.log(`   Unique Bond Holders: ${uniqueHolders.size}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const warnings = results.filter(r => r.warning).length;

    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    if (warnings > 0) console.log(`Warnings: ${warnings} ⚠️`);

    if (failed === 0) {
      console.log('\n✅ ALL SUBGRAPH TESTS PASSED');
      console.log('\nSubgraph is ready for frontend integration.');
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log('\nFailed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  }
}

main();
