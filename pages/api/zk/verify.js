import { verifyProof } from '@semaphore-protocol/proof';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { fullProof } = req.body;
      if (!fullProof) {
        return res.status(400).json({ valid: false, error: 'Missing fullProof' });
      }
      // Debug: log the structure
      console.log('Received fullProof:', fullProof);

      // Check for required fields
      if (
        !fullProof.proof 
      ) {
        return res.status(400).json({ valid: false, error: 'Invalid fullProof structure' });
      }

      // Pass the correct tree depth (e.g., 20)
      const treeDepth = 20; 
      const isValid = await verifyProof(fullProof, treeDepth);
      res.status(200).json({ valid: isValid });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ valid: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}