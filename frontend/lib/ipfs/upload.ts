/**
 * Client-side IPFS Upload Utility
 * For uploading files to Pinata from the browser
 */

export interface IPFSUploadResult {
  cid: string;
  gatewayUrl: string;
  size: number;
}

/**
 * Upload a file to IPFS via Pinata
 * This function is designed to be called from the browser
 */
export async function uploadFileToIPFS(file: File): Promise<IPFSUploadResult> {
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        contentType: file.type,
      }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to our API route (which will use server-side Pinata credentials)
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IPFS upload failed: ${response.status} - ${error}`);
    }

    const result = await response.json();

    return {
      cid: result.cid,
      gatewayUrl: result.gatewayUrl,
      size: result.size,
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Upload JSON metadata to IPFS via Pinata
 * Converts the object to a JSON file and uploads it
 */
export async function uploadToIPFS(data: object | File): Promise<string> {
  // If it's a File, use the file upload function
  if (data instanceof File) {
    const result = await uploadFileToIPFS(data);
    return `ipfs://${result.cid}`;
  }

  try {
    // Convert object to JSON blob
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'metadata.json', { type: 'application/json' });

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: 'project-metadata.json',
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        contentType: 'application/json',
      }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to our API route
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IPFS upload failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return `ipfs://${result.cid}`;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Get the gateway URL for an IPFS CID
 */
export function getIPFSUrl(cid: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lime-active-constrictor-506.mypinata.cloud';
  return `https://${gateway}/ipfs/${cid}`;
}

/**
 * Convert an IPFS URL (ipfs://...) to a gateway URL
 * Handles both ipfs:// URLs and raw CIDs
 */
export function ipfsToGatewayUrl(ipfsUrl: string | undefined | null): string | null {
  if (!ipfsUrl) return null;

  // If it's already an HTTP URL, return as-is
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    return ipfsUrl;
  }

  // Extract CID from ipfs:// URL
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    return getIPFSUrl(cid);
  }

  // If it looks like a raw CID (starts with Qm or bafy), convert it
  if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafy')) {
    return getIPFSUrl(ipfsUrl);
  }

  // Return as-is for other URLs (like /images/...)
  return ipfsUrl;
}
