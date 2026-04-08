"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useWriteContracts, useCallsStatus } from "wagmi/experimental";
import { CONTRACT_ADDRESS, FRUIT_SLASH_ABI, PAYMASTER_URL } from "@/lib/constants";
import { encodeFunctionData } from "viem";

const IS_DEMO = CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  const capabilities = useMemo(() => {
    if (!PAYMASTER_URL) return undefined;
    return {
      paymasterService: {
        url: PAYMASTER_URL,
      },
    };
  }, []);

  // --- Reads ---

  const { data: highScore, refetch: refetchHighScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FRUIT_SLASH_ABI,
    functionName: "highScores",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !IS_DEMO },
  });

  const { data: totalPlayers } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FRUIT_SLASH_ABI,
    functionName: "totalPlayers",
    query: { enabled: !IS_DEMO },
  });

  const { data: hasFruitNFT, refetch: refetchNFT } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FRUIT_SLASH_ABI,
    functionName: "hasFruitNFT",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !IS_DEMO },
  });

  const { data: checkInInfo, refetch: refetchCheckIn } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FRUIT_SLASH_ABI,
    functionName: "getCheckInInfo",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !IS_DEMO },
  });

  // --- Slash ---

  const {
    writeContracts: writeSlash,
    data: slashCallId,
    isPending: isSlashPending,
    error: slashError,
  } = useWriteContracts();

  const slashId = typeof slashCallId === "string" ? slashCallId : "";
  const { data: slashStatus } = useCallsStatus({
    id: slashId,
    query: { enabled: slashId.length > 0, refetchInterval: 1000 },
  });

  const isSlashConfirmed = slashStatus?.status === "success";

  const doSlash = useCallback(() => {
    if (IS_DEMO) return;
    writeSlash({
      contracts: [
        {
          address: CONTRACT_ADDRESS,
          abi: FRUIT_SLASH_ABI,
          functionName: "slash",
          args: [],
        },
      ],
      capabilities,
    });
  }, [writeSlash, capabilities]);

  // Detect NFT mint from status receipts
  if (slashStatus?.status === "success" && mintedTokenId === null && slashStatus.receipts) {
    for (const receipt of slashStatus.receipts) {
      for (const log of receipt.logs) {
        if (log.topics[0] === "0x2f00c5f47720460e13e1e8c498d24a5f225b46e30a0e4a981b72c424a960a9c4") {
          // FruitNFTMinted event topic
          try {
            const tokenId = parseInt(log.data, 16);
            if (tokenId > 0) setMintedTokenId(tokenId);
          } catch {}
        }
      }
    }
  }

  // --- Check-in ---

  const {
    writeContracts: writeCheckIn,
    data: checkInCallId,
    isPending: isCheckInPending,
    error: checkInError,
  } = useWriteContracts();

  const checkInId = typeof checkInCallId === "string" ? checkInCallId : "";
  const { data: checkInStatus } = useCallsStatus({
    id: checkInId,
    query: { enabled: checkInId.length > 0, refetchInterval: 1000 },
  });

  const isCheckInConfirmed = checkInStatus?.status === "success";

  const doCheckIn = useCallback(() => {
    if (IS_DEMO) return;
    writeCheckIn({
      contracts: [
        {
          address: CONTRACT_ADDRESS,
          abi: FRUIT_SLASH_ABI,
          functionName: "checkIn",
          args: [],
        },
      ],
      capabilities,
    });
  }, [writeCheckIn, capabilities]);

  // --- Submit score ---

  const {
    writeContracts: writeSubmit,
    data: submitCallId,
    isPending: isSubmitPending,
    error: submitError,
  } = useWriteContracts();

  const submitId = typeof submitCallId === "string" ? submitCallId : "";
  const { data: submitStatus } = useCallsStatus({
    id: submitId,
    query: { enabled: submitId.length > 0, refetchInterval: 1000 },
  });

  const isSubmitConfirmed = submitStatus?.status === "success";

  const submitScore = useCallback(
    (score: number) => {
      if (IS_DEMO) return;
      if (!highScore || BigInt(score) > (highScore as bigint)) {
        writeSubmit({
          contracts: [
            {
              address: CONTRACT_ADDRESS,
              abi: FRUIT_SLASH_ABI,
              functionName: "submitScore",
              args: [BigInt(score)],
            },
          ],
          capabilities,
        });
      }
    },
    [writeSubmit, highScore, capabilities],
  );

  // --- Parse check-in data ---

  const checkInData = checkInInfo as [bigint, bigint, bigint, boolean] | undefined;
  const checkedInToday = IS_DEMO ? false : (checkInData?.[3] ?? false);
  const streak = checkInData ? Number(checkInData[1]) : 0;
  const totalCheckIns = checkInData ? Number(checkInData[2]) : 0;

  return {
    address,
    isConnected,
    chain,
    highScore: highScore ? Number(highScore) : 0,
    totalPlayers: totalPlayers ? Number(totalPlayers) : IS_DEMO ? 0 : 0,
    hasFruitNFT: IS_DEMO ? false : !!hasFruitNFT,

    // Slash
    doSlash,
    isSlashing: isSlashPending || (slashId.length > 0 && !isSlashConfirmed),
    isSlashConfirmed,
    slashError,
    mintedTokenId,
    clearMintNotification: () => setMintedTokenId(null),

    // Check-in
    doCheckIn,
    isCheckingIn: isCheckInPending || (checkInId.length > 0 && !isCheckInConfirmed),
    isCheckInConfirmed,
    checkInError,
    checkedInToday,
    streak,
    totalCheckIns,
    refetchCheckIn,

    // Score
    submitScore,
    isSubmitting: isSubmitPending || (submitId.length > 0 && !isSubmitConfirmed),
    isSubmitConfirmed,
    submitError,
    refetchHighScore,
    refetchNFT,
  };
}
