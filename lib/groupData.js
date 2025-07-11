let groupData = { id: 1, treeDepth: 20, members: [], root: null };

export const getGroupData = () => groupData;

export const updateGroupData = (newData) => {
  groupData = { ...groupData, ...newData };
};

export const addMember = (commitment) => {
  if (!groupData.members.includes(commitment)) {
    groupData.members.push(commitment);
    console.log('Updated groupData:', groupData);
  }
};

export const resetGroupData = () => {
  groupData = { id: 1, treeDepth: 20, members: [], root: null };
};
