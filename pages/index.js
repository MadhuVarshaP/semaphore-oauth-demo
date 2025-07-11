
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Identity } from '@semaphore-protocol/identity';
import { generateProof } from '@semaphore-protocol/proof';
import { Group } from '@semaphore-protocol/group';

export default function Home() {
  const { data: session, status } = useSession();
  const [identity, setIdentity] = useState(null);
  const [group, setGroup] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Helper function to add logs
  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // Function to add commitment to group
  const addToGroup = async (commitment) => {
    try {
      const response = await fetch('/api/zk/group/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitment: commitment.toString() }),
      });
      const data = await response.json();
      if (!response.ok || data.message.includes('Error')) {
        throw new Error(data.message || 'Failed to add member to group');
      }
      addLog(`Successfully added commitment to group: ${data.message}`);
      return true;
    } catch (error) {
      console.error('Error adding member:', error);
      addLog(`Error adding member to group: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      // Load or generate Semaphore identity
      const storedPrivateKey = localStorage.getItem('semaphorePrivateKey');
      addLog(`Stored private key: ${storedPrivateKey ? 'Loaded' : 'None'}`);
      if (storedPrivateKey) {
        try {
          if (typeof storedPrivateKey !== 'string') {
            throw new Error('Stored private key is not a string');
          }
          const newIdentity = new Identity(storedPrivateKey);
          setIdentity(newIdentity);
          addLog(`Identity loaded with commitment: ${newIdentity.commitment.toString()}`);
          // Ensure existing commitment is in group
          addToGroup(newIdentity.commitment);
        } catch (error) {
          console.error('Error loading identity:', error);
          setVerificationResult('Error loading identity: ' + error.message);
          addLog('Error loading identity: ' + error.message);
        }
      } else {
        (async () => {
          const id = new Identity();
          localStorage.setItem('semaphorePrivateKey', id.toString());
          setIdentity(id);
          addLog(`New identity created, commitment: ${id.commitment.toString()}`);
          const added = await addToGroup(id.commitment);
          if (!added) {
            setVerificationResult('Error: Failed to add new identity to group');
          }
        })();
      }
    }
  }, [status]);

  const handleProveMembership = async () => {
    if (!identity) {
      setVerificationResult('No identity found. Please log in again.');
      addLog('No identity found. Please log in again.');
      return;
    }

    try {
      // Fetch full group
      const response = await fetch('/api/zk/group/full');
      const groupData = await response.json();
      console.log('Group data received:', groupData);
      addLog(`Group data: ID=${groupData.id}, TreeDepth=${groupData.treeDepth || '20'}, MemberCount=${groupData.memberCount}, Root=${groupData.root}`);

      if (!response.ok || !groupData.success) {
        setVerificationResult(`Error: ${groupData.message || groupData.error || 'Failed to fetch group'}`);
        addLog(`Error: ${groupData.message || groupData.error || 'Failed to fetch group'}`);
        return;
      }

      // Validate group data
      if (!groupData.id || !Array.isArray(groupData.members)) {
        setVerificationResult(`Error: Invalid group data received (missing ${!groupData.id ? 'id' : 'members'})`);
        addLog(`Error: Invalid group data received (missing ${!groupData.id ? 'id' : 'members'})`);
        return;
      }

      // Use default treeDepth if missing
      const treeDepth = groupData.treeDepth || 20;
      addLog(`Using treeDepth: ${treeDepth}`);

      // Initialize group
      const groupId = groupData.id;
      const members = groupData.members.map(BigInt);
      const fetchedGroup = new Group(groupId, treeDepth, members);
      setGroup(fetchedGroup);

      // Check if the current identity is in the group
      const userCommitment = identity.commitment;
      console.log('User commitment:', userCommitment.toString());
      console.log('Group members:', fetchedGroup.members.map(m => m.toString()));
      addLog(`User commitment: ${userCommitment.toString()}`);
      addLog(`Group has ${fetchedGroup.members.length} members`);

      if (!fetchedGroup.members.includes(userCommitment)) {
        addLog('Identity not in group, attempting to re-add...');
        const added = await addToGroup(userCommitment);
        if (!added) {
          setVerificationResult('Error: Failed to add identity to group. Please clear local storage and try again.');
          addLog('Error: Failed to add identity to group.');
          return;
        }
        // Re-fetch group after adding
        const retryResponse = await fetch('/api/zk/group/full');
        const retryGroupData = await retryResponse.json();
        if (!retryResponse.ok || !retryGroupData.success) {
          setVerificationResult('Error: Failed to fetch group after retry');
          addLog('Error: Failed to fetch group after retry');
          return;
        }
        const retryMembers = retryGroupData.members.map(BigInt);
        const retryGroup = new Group(retryGroupData.id, retryGroupData.treeDepth || 20, retryMembers);
        setGroup(retryGroup);
        if (!retryGroup.members.includes(userCommitment)) {
          setVerificationResult('Error: Your identity is still not in the group. Please clear local storage and try again.');
          addLog('Error: Identity still not in group after retry.');
          return;
        }
      }

      // Generate ZK proof
      const signal = BigInt(1);
      const externalNullifier = BigInt(Math.floor(Math.random() * 1000000));
      console.log('Generating proof with:', { signal: signal.toString(), externalNullifier: externalNullifier.toString() });
      addLog(`Generating proof with: Signal=${signal.toString()}, ExternalNullifier=${externalNullifier.toString()}`);
      const fullProof = await generateProof(identity, fetchedGroup, signal, externalNullifier);

      // Send proof to server
      const verifyResponse = await fetch('/api/zk/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullProof }),
      });
      const verifyData = await verifyResponse.json();
      setVerificationResult(verifyData.valid ? 'ZK login verified!' : 'Invalid proof');
      addLog(verifyData.valid ? 'ZK login verified!' : `Proof verification failed: ${verifyData.error || 'Invalid proof'}`);
    } catch (error) {
      console.error('Error in handleProveMembership:', error);
      setVerificationResult(`Error: ${error.message}`);
      addLog(`Error in proof generation: ${error.message}`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="font-sans p-10 text-center text-lg text-gray-600">
        <span>Loading...</span>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="p-8 font-sans max-w-xl mx-auto bg-gray-50 rounded-lg shadow-md">
        <p className="text-lg text-green-700 font-bold mb-5">
          ✅ Logged in successfully
        </p>

        <div className="flex gap-4 mb-5">
          <button
            onClick={signOut}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded transition-colors duration-300"
          >
            Sign out
          </button>

          <button
            onClick={handleProveMembership}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition-colors duration-300"
          >
            Prove you're a member
          </button>
        </div>

        {verificationResult && (
          <p
            className={`font-bold mb-5 p-3 rounded ${
              verificationResult.includes('Error')
                ? 'text-red-600 bg-red-100'
                : 'text-green-600 bg-green-100'
            }`}
          >
            {verificationResult}
          </p>
        )}
        <h3 className="text-base mb-2 text-gray-700 font-semibold">Log Information</h3>
        <ul className="list-none p-3 bg-white border border-gray-200 rounded max-w-full break-words">
          {logs.map((log, index) => (
            <li
              key={index}
              className={`text-sm text-gray-700 py-1 break-words whitespace-pre-wrap ${
                index !== logs.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              {log}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-8 font-sans text-center">
      <p className="mb-4 text-2xl font-semibold">
        Semaphore + Oauth Demo
      </p>
      <button
        onClick={() => signIn('google')}
        className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded font-bold text-base transition-colors duration-300"
      >
        Login with Google
      </button>
    </div>
  );
}
