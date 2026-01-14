import PinataSDK from '@pinata/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

// Initialize Pinata - support both JWT and API key auth
let pinata: PinataSDK;
if (PINATA_JWT) {
  pinata = new PinataSDK({ pinataJWTKey: PINATA_JWT });
} else if (PINATA_API_KEY && PINATA_API_SECRET) {
  pinata = new PinataSDK({
    pinataApiKey: PINATA_API_KEY,
    pinataSecretApiKey: PINATA_API_SECRET,
  });
} else {
  throw new Error('Either PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET required');
}

// Exact schema matching frontend/types/project.ts
interface ProjectLocation {
  country: string;
  region: string;
  coordinates: [number, number]; // [lat, lng]
}

interface ProjectMetadata {
  name: string;
  description: string;
  category: 'water' | 'solar' | 'education' | 'healthcare' | 'agriculture';
  location: ProjectLocation;
  imageUrl: string;
  revenueModel: string;
  projectedAPY: number;
}

interface UploadResult {
  projectName: string;
  imageUri: string;
  metadataUri: string;
}

// Project metadata - THESE ARE THE FINAL VALUES TO UPLOAD
const PROJECTS: Array<{ filename: string; imagePath: string; metadata: ProjectMetadata }> = [
  {
    filename: 'project-1-water',
    imagePath: './images/water-project.jpg',
    metadata: {
      name: 'Kisumu Community Water Well',
      description: 'Solar-powered borehole providing clean water to 2,500 residents in Kisumu County, Kenya. Revenue generated through community water kiosk fees, with a sustainable pricing model ensuring affordability while covering maintenance and generating returns for bondholders.',
      category: 'water',
      location: {
        country: 'Kenya',
        region: 'Kisumu County',
        coordinates: [-0.1022, 34.7617],
      },
      imageUrl: '',
      revenueModel: 'Water kiosk fees at $0.02 per 20L container, averaging 500 containers/day',
      projectedAPY: 12,
    },
  },
  {
    filename: 'project-2-solar',
    imagePath: './images/solar-project.jpg',
    metadata: {
      name: 'Lagos Solar Mini-Grid',
      description: 'A 50kW solar installation providing reliable electricity to 200 households and 15 small businesses in peri-urban Lagos. Customers pay via mobile money on a pay-as-you-go model, creating predictable revenue streams.',
      category: 'solar',
      location: {
        country: 'Nigeria',
        region: 'Lagos State',
        coordinates: [6.5244, 3.3792],
      },
      imageUrl: '',
      revenueModel: 'Pay-as-you-go electricity sales via mobile money, $0.25/kWh',
      projectedAPY: 15,
    },
  },
  {
    filename: 'project-3-education',
    imagePath: './images/education-project.jpg',
    metadata: {
      name: 'Kigali Digital Skills Lab',
      description: 'A computer training center providing digital literacy and coding bootcamps to youth in Kigali. Partnership with local tech companies for job placement. Revenue from course fees and corporate training contracts.',
      category: 'education',
      location: {
        country: 'Rwanda',
        region: 'Kigali',
        coordinates: [-1.9403, 29.8739],
      },
      imageUrl: '',
      revenueModel: 'Course fees ($50-200/course) + corporate training contracts ($500-2000/session)',
      projectedAPY: 10,
    },
  },
  {
    filename: 'project-4-healthcare',
    imagePath: './images/healthcare-project.jpg',
    metadata: {
      name: 'Dar es Salaam Mobile Clinic',
      description: 'Fleet of 3 mobile medical units serving rural communities around Dar es Salaam. Provides basic healthcare, maternal care, and vaccination services. Revenue from government health insurance reimbursements and fee-for-service.',
      category: 'healthcare',
      location: {
        country: 'Tanzania',
        region: 'Dar es Salaam Region',
        coordinates: [-6.7924, 39.2083],
      },
      imageUrl: '',
      revenueModel: 'Government NHIF reimbursements + patient fees averaging $5/visit',
      projectedAPY: 8,
    },
  },
  {
    filename: 'project-5-agriculture',
    imagePath: './images/agriculture-project.jpg',
    metadata: {
      name: 'Sidama Coffee Cooperative',
      description: "Processing facility for 500 smallholder coffee farmers in Ethiopia's Sidama region. Provides washing, drying, and grading services, enabling farmers to access premium specialty coffee markets. Revenue from processing fees and direct export sales.",
      category: 'agriculture',
      location: {
        country: 'Ethiopia',
        region: 'Sidama',
        coordinates: [6.7333, 38.4667],
      },
      imageUrl: '',
      revenueModel: 'Processing fees ($0.15/kg) + 10% margin on export sales (~$4.50/kg premium)',
      projectedAPY: 18,
    },
  },
];

async function uploadImage(imagePath: string, projectName: string): Promise<string> {
  const absolutePath = path.resolve(__dirname, imagePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Image not found: ${absolutePath}`);
    throw new Error(`Image file not found: ${imagePath}`);
  }

  console.log(`  Uploading image: ${absolutePath}`);
  const readableStream = fs.createReadStream(absolutePath);
  const result = await pinata.pinFileToIPFS(readableStream, {
    pinataMetadata: { name: `${projectName}-image` },
  });

  return `ipfs://${result.IpfsHash}`;
}

async function uploadMetadata(metadata: ProjectMetadata, name: string): Promise<string> {
  console.log(`  Uploading metadata for: ${metadata.name}`);
  console.log(`    Category: ${metadata.category}`);
  console.log(`    Location: ${metadata.location.country}, ${metadata.location.region}`);
  console.log(`    APY: ${metadata.projectedAPY}%`);

  const result = await pinata.pinJSONToIPFS(metadata, {
    pinataMetadata: { name: `${name}-metadata.json` },
  });

  return `ipfs://${result.IpfsHash}`;
}

async function main() {
  console.log('Uploading project metadata to IPFS via Pinata...\n');
  console.log(`Using ${PINATA_JWT ? 'JWT' : 'API Key'} authentication\n`);

  const results: UploadResult[] = [];

  for (const project of PROJECTS) {
    console.log(`Processing: ${project.filename}`);

    // 1. Upload image first
    const imageUri = await uploadImage(project.imagePath, project.filename);
    console.log(`  Image URI: ${imageUri}`);

    // 2. Update metadata with image URI
    const metadata = { ...project.metadata, imageUrl: imageUri };

    // 3. Upload metadata JSON
    const metadataUri = await uploadMetadata(metadata, project.filename);
    console.log(`  Metadata URI: ${metadataUri}`);

    results.push({
      projectName: project.filename,
      imageUri,
      metadataUri,
    });

    console.log('');
  }

  // Save results for use in seeding script
  const outputPath = path.join(__dirname, 'upload-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('='.repeat(50));
  console.log('Upload Complete!');
  console.log('='.repeat(50));
  console.log(`\nResults saved to: ${outputPath}`);
  console.log('\nIPFS URIs to use in seed script:');
  results.forEach((r) => {
    console.log(`  ${r.projectName}: ${r.metadataUri}`);
  });
}

main().catch(console.error);
