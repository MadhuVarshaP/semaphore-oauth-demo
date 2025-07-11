// import { verifyProof } from '@semaphore-protocol/proof';

// export default function handler(req, res) {
//   if (req.method === 'POST') {
//     const fullProof = req.body;
//     const isValid = verifyProof(fullProof);
//     res.status(200).json({ valid: isValid });
//   } else {
//     res.status(405).json({ message: 'Method not allowed' });
//   }
// }

import { verifyProof } from '@semaphore-protocol/proof';

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { fullProof } = req.body;
      if (!fullProof) {
        return res.status(400).json({ valid: false, error: 'Missing fullProof' });
      }
      const isValid = verifyProof(fullProof);
      res.status(200).json({ valid: isValid });
    } catch (error) {
      console.error('Error verifying proof:', error);
      res.status(500).json({ valid: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}