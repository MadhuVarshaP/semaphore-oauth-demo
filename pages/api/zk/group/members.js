import { Group } from '@semaphore-protocol/group';
import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getGroupData, addMember } from '../../../lib/groupData';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      // Verify session
      const session = await getServerSession(req, res, {
        providers: [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: 'select_account' } },
          }),
        ],
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!session || !session.user || !session.user.email) {
        console.log('Unauthorized access attempt');
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
      }

      const { commitment } = req.body;
      if (!commitment) {
        console.log('Missing commitment in request');
        return res.status(400).json({ message: 'Commitment is required' });
      }

      try {
        BigInt(commitment); // Validate commitment
      } catch {
        console.log('Invalid commitment format:', commitment);
        return res.status(400).json({ message: 'Invalid commitment format' });
      }

      const groupData = getGroupData();
      if (groupData.members.includes(commitment)) {
        console.log('Commitment already exists:', commitment);
        return res.status(200).json({ message: 'Member already exists' });
      }

      addMember(commitment);
      console.log('Added commitment:', commitment);

      // Update group root
      const group = new Group(groupData.id, groupData.treeDepth, groupData.members.map(BigInt));
      groupData.root = group.root.toString();
      res.status(200).json({ message: 'Member added' });
    } catch (error) {
      console.error('Error adding member:', error.message, error.stack);
      res.status(500).json({ message: 'Error adding member', error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const groupData = getGroupData();
      res.status(200).json({ members: groupData.members });
    } catch (error) {
      console.error('Error loading group members:', error.message);
      res.status(500).json({ message: 'Error loading group members', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}