// import fs from 'fs';
// import path from 'path';
// import { Group } from '@semaphore-protocol/group';

// const groupFilePath = path.join(process.cwd(), 'semaphore', 'group.json');

// function getDefaultGroupData() {
//   return { id: 1, treeDepth: 20, members: [] };
// }

// function ensureSemaphoreDir() {
//   const semaphoreDir = path.dirname(groupFilePath);
//   if (!fs.existsSync(semaphoreDir)) {
//     fs.mkdirSync(semaphoreDir, { recursive: true });
//   }
// }

// function loadGroupData() {
//   ensureSemaphoreDir();
//   if (!fs.existsSync(groupFilePath)) {
//     console.log('group.json not found, creating default');
//     const defaultData = getDefaultGroupData();
//     fs.writeFileSync(groupFilePath, JSON.stringify(defaultData, null, 2));
//     return defaultData;
//   }
//   try {
//     const data = fs.readFileSync(groupFilePath, 'utf8');
//     const groupData = JSON.parse(data);
//     console.log('Loaded groupData:', groupData);
//     // Validate structure
//     if (
//       typeof groupData !== 'object' ||
//       groupData === null ||
//       !Array.isArray(groupData.members) ||
//       typeof groupData.treeDepth !== 'number' ||
//       typeof groupData.id !== 'number'
//     ) {
//       console.error('Invalid group.json structure, resetting to default');
//       const defaultData = getDefaultGroupData();
//       fs.writeFileSync(groupFilePath, JSON.stringify(defaultData, null, 2));
//       return defaultData;
//     }
//     return groupData;
//   } catch (error) {
//     console.error('Error loading group data:', error.message);
//     const defaultData = getDefaultGroupData();
//     fs.writeFileSync(groupFilePath, JSON.stringify(defaultData, null, 2));
//     return defaultData;
//   }
// }

// export default function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') {
//     res.status(200).end();
//     return;
//   }

//   if (req.method === 'GET') {
//     try {
//       const groupData = loadGroupData();
//       console.log('Group data before Group constructor:', groupData);
//       // Ensure members is an array and convert to BigInt
//       const members = Array.isArray(groupData.members) ? groupData.members.map(member => {
//         try {
//           return BigInt(member);
//         } catch {
//           console.warn(`Invalid member skipped: ${member}`);
//           return null;
//         }
//       }).filter(member => member !== null) : [];
      
//       // Initialize Group
//       const group = new Group(groupData.id || 1, groupData.treeDepth || 20, members);
//       console.log('Group initialized:', { id: group.id, treeDepth: group.treeDepth, memberCount: group.members.length });

//       // Update group.json if members were filtered
//       if (members.length !== groupData.members.length) {
//         groupData.members = members.map(member => member.toString());
//         fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
//       }

//       res.status(200).json({
//         success: true,
//         id: group.id,
//         treeDepth: group.treeDepth,
//         members: group.members.map(member => member.toString()),
//         memberCount: group.members.length,
//         root: group.root.toString(),
//         maxMembers: Math.pow(2, group.treeDepth)
//       });
//     } catch (error) {
//       console.error('Error in /api/zk/group/full:', error.message, error.stack);
//       res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         message: error.message
//       });
//     }
//   } else {
//     res.status(405).json({
//       success: false,
//       error: 'Method not allowed',
//       message: `Method ${req.method} not allowed. Supported methods: GET, OPTIONS`
//     });
//   }
// }

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
    // Validate structure
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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const groupData = loadGroupData();
      console.log('Group data before Group constructor:', groupData);
      // Ensure members is an array and convert to BigInt
      const members = Array.isArray(groupData.members)
        ? groupData.members.map(member => {
            try {
              return BigInt(member);
            } catch {
              console.warn(`Invalid member skipped: ${member}`);
              return null;
            }
          }).filter(member => member !== null)
        : [];
      
      // Initialize Group
      const group = new Group(groupData.id || 1, groupData.treeDepth || 20, members);
      console.log('Group initialized:', {
        id: group.id,
        treeDepth: group.treeDepth,
        memberCount: group.members.length
      });

      // Update group.json if members were filtered
      if (members.length !== groupData.members.length) {
        groupData.members = members.map(member => member.toString());
        fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
      }

      res.status(200).json({
        success: true,
        id: group.id,
        treeDepth: group.treeDepth,
        members: group.members.map(member => member.toString()),
        memberCount: group.members.length,
        root: group.root.toString(),
        maxMembers: Math.pow(2, group.treeDepth)
      });
    } catch (error) {
      console.error('Error in /api/zk/group/full:', error.message, error.stack);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: `Method ${req.method} not allowed. Supported methods: GET, OPTIONS`
    });
  }
}