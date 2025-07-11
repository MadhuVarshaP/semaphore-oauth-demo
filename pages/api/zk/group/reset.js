import { resetGroupData } from '../../../../lib/groupData';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      resetGroupData();
      console.log('Group data reset');
      res.status(200).json({ message: 'Group data reset' });
    } catch (error) {
      console.error('Error resetting group data:', error.message);
      res.status(500).json({ message: 'Error resetting group data', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}