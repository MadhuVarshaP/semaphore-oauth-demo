import fs from 'fs/promises';
import path from 'path';
import { Group } from '@semaphore-protocol/group';

const GROUP_FILE = path.join(process.cwd(), 'data', 'group.json');
const DEFAULT_GROUP = { id: 1, treeDepth: 20, members: [], root: null };

async function ensureGroupFile() {
  try {
    await fs.access(GROUP_FILE);
  } catch {
    await saveGroupData(DEFAULT_GROUP);
  }
}

export async function getGroupData() {
  await ensureGroupFile();
  try {
    const raw = await fs.readFile(GROUP_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!data.id || !data.treeDepth || !Array.isArray(data.members)) throw new Error('Corrupt group data');
    return data;
  } catch (err) {
    await saveGroupData(DEFAULT_GROUP);
    return { ...DEFAULT_GROUP };
  }
}

export async function saveGroupData(data) {
  await fs.mkdir(path.dirname(GROUP_FILE), { recursive: true });
  await fs.writeFile(GROUP_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function addMember(commitment) {
  const groupData = await getGroupData();
  if (groupData.members.includes(commitment)) return false;
  groupData.members.push(commitment);
  const group = new Group(groupData.id, groupData.treeDepth, groupData.members.map(BigInt));
  groupData.root = group.root.toString();
  await saveGroupData(groupData);
  return true;
}

export async function resetGroupData() {
  await saveGroupData({ ...DEFAULT_GROUP });
}

export async function getMerkleRoot() {
  const groupData = await getGroupData();
  const group = new Group(groupData.id, groupData.treeDepth, groupData.members.map(BigInt));
  return group.root.toString();
} 