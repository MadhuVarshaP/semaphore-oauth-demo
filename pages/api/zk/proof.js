import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getGroupData } from "../../../lib/semaphore/group";
import { generateProof } from "@semaphore-protocol/proof";
import { createIdentity } from "../../../lib/semaphore/identity";
import { Group } from "@semaphore-protocol/group";
import { keccak256 } from "ethers/lib/utils";
import path from "path";
import fs from "fs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, {
        providers: [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: "select_account" } },
          }),
        ],
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!session || !session.user?.email) {
        return res.status(401).json({ message: "Unauthorized: Please log in" });
      }

      const { signal } = req.body;
      if (!signal) {
        return res.status(400).json({ message: "Signal is required" });
      }

      // 1. Create identity from email
      const identity = createIdentity(session.user.email);
      const commitment = identity.commitment.toString();

      // 2. Get group data
      const groupData = await getGroupData();

      // 3. Check membership
      if (!groupData.members.includes(commitment)) {
        return res.status(403).json({
          message: "Forbidden: Your identity is not a member of the group."
        });
      }

      // 4. Prepare group as a Group instance (recommended for v3)
      const group = new Group(groupData.id, groupData.treeDepth);
      groupData.members.forEach(member => {
        try {
          if (member !== undefined && member !== null && member !== "") {
            group.addMember(BigInt(member));
          }
        } catch (e) {
          // Skip invalid members
        }
      });

      // 5. Use group.root as externalNullifier (per docs)
      const externalNullifier = group.root;

      // 6. Use the provided signal (can be string or number)
      // If not a number, hash it to a BigInt
      let signalValue;
      if (/^-?\\d+$/.test(signal)) {
        signalValue = BigInt(signal);
      } else {
        signalValue = BigInt(keccak256(Buffer.from(signal)));
      }

      // 7. Prepare circuit files
      const wasmFilePath = path.join(process.cwd(), "public/semaphore/20/semaphore.wasm");
      const zkeyFilePath = path.join(process.cwd(), "public/semaphore/20/semaphore.zkey");

      console.log("Checking .wasm and .zkey file existence...");
      console.log("WASM exists:", fs.existsSync(wasmFilePath));
      console.log("ZKEY exists:", fs.existsSync(zkeyFilePath));

      // 8. Generate proof
      let fullProof;
      try {
        fullProof = await generateProof(
          identity,
          group,
          externalNullifier,
          signalValue,
          { wasmFilePath, zkeyFilePath }
        );
      } catch (err) {
        console.error("generateProof threw error:", err);
        return res.status(500).json({
          message: "Error generating proof (generateProof threw)",
          error: err.message
        });
      }

      if (!fullProof || !fullProof.proof ) {
        return res.status(500).json({
          message: "Proof generation failed: missing proof "
        });
      }

      res.status(200).json({ fullProof });

    } catch (error) {
      console.error("Proof generation error:", error);
      res.status(500).json({
        message: "Error generating proof",
        error: error.message
      });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}