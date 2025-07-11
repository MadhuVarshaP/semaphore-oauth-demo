import { Group } from '@semaphore-protocol/group';
import { getGroupData } from '../../../lib/groupData';

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
      const groupData = getGroupData();
      const group = new Group(groupData.id, groupData.treeDepth, groupData.members.map(BigInt));
      res.status(200).json({
        success: true,
        id: groupData.id,
        treeDepth: groupData.treeDepth,
        members: groupData.members,
        memberCount: groupData.members.length,
        root: group.root.toString(),
      });
    } catch (error) {
      console.error('Error fetching group data:', error.message);
      res.status(500).json({ success: false, message: 'Error fetching group data', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}