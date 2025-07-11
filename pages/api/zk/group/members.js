import fs from 'fs';
import path from 'path';
import { Group } from '@semaphore-protocol/group';

const groupFilePath = path.join(process.cwd(), 'semaphore', 'group.json');

function getDefaultGroupData() {
  return { id: 1, treeDepth: 20, members: [] };
}

function ensureSemaphoreDir() {
  const semaphoreDir = path.dirname(groupFilePath);
  if (!fs.existsSync(semaphoreDir)) {
    fs.mkdirSync(semaphoreDir, { recursive: true });
  }
}

function loadGroupData() {
  ensureSemaphoreDir();
  if (!fs.existsSync(groupFilePath)) {
    console.log('group.json not found, creating default');
    const defaultData = getDefaultGroupData();
    fs.writeFileSync(groupFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const data = fs.readFileSync(groupFilePath, 'utf8');
    const groupData = JSON.parse(data);
    console.log('Loaded groupData:', groupData);
    if (
      typeof groupData !== 'object' ||
      groupData === null ||
      !Array.isArray(groupData.members) ||
      typeof groupData.treeDepth !== 'number' ||
      typeof groupData.id !== 'number'
    ) {
      console.error('Invalid group.json structure, resetting to default');
      const defaultData = getDefaultGroupData();
      fs.writeFileSync(groupFilePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    return groupData;
  } catch (error) {
    console.error('Error loading group data:', error.message);
    const defaultData = getDefaultGroupData();
    fs.writeFileSync(groupFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function saveGroupData(groupData) {
  fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { commitment } = req.body;
      if (!commitment) {
        return res.status(400).json({ message: 'Commitment is required' });
      }
      const commitmentBigInt = BigInt(commitment);
      const groupData = loadGroupData();
      if (groupData.members.includes(commitment)) {
        return res.status(200).json({ message: 'Member already exists' });
      }
      groupData.members.push(commitment);
      saveGroupData(groupData);
      res.status(200).json({ message: 'Member added' });
    } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({ message: 'Error adding member', error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const groupData = loadGroupData();
      res.status(200).json({ members: groupData.members });
    } catch (error) {
      console.error('Error loading group members:', error);
      res.status(500).json({ message: 'Error loading group members', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}