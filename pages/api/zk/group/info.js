import { getMerkleRoot, getGroupData } from '../../../../lib/semaphore/group';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const groupData = await getGroupData();
      const root = await getMerkleRoot();
      res.status(200).json({
        root,
        memberCount: groupData.members.length,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching group info', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 