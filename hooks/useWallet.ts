"use client";

import { useCallback, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, FRUIT_SLASH_ABI } from "@/lib/constants";
import { decodeEventLog } from "viem";

const IS_DEMO = CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

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
    writeContract: writeSlash,
    data: slashHash,
    isPending: isSlashPending,
    error: slashError,
  } = useWriteContract();

  const { isLoading: isSlashConfirming, isSuccess: isSlashConfirmed, data: slashReceipt } =
    useWaitForTransactionReceipt({ hash: slashHash });

  const doSlash = useCallback(() => {
    if (IS_DEMO) return;
    writeSlash({
      address: CONTRACT_ADDRESS,
      abi: FRUIT_SLASH_ABI,
      functionName: "slash",
    });
  }, [writeSlash]);

  // Detect NFT mint from slash receipt
  if (slashReceipt && mintedTokenId === null) {
    try {
      for (const log of slashReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: FRUIT_SLASH_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "FruitNFTMinted") {
            setMintedTokenId(Number((decoded.args as any).tokenId));
          }
        } catch {
          // not our event
        }
      }
    } catch {
      // ignore
    }
  }

  // --- Check-in ---

  const {
    writeContract: writeCheckIn,
    data: checkInHash,
    isPending: isCheckInPending,
    error: checkInError,
  } = useWriteContract();

  const { isLoading: isCheckInConfirming, isSuccess: isCheckInConfirmed } =
    useWaitForTransactionReceipt({ hash: checkInHash });

  const doCheckIn = useCallback(() => {
    if (IS_DEMO) return;
    writeCheckIn({
      address: CONTRACT_ADDRESS,
      abi: FRUIT_SLASH_ABI,
      functionName: "checkIn",
    });
  }, [writeCheckIn]);

  // --- Submit score ---

  const {
    writeContract: writeSubmit,
    data: submitHash,
    isPending: isSubmitPending,
    error: submitError,
  } = useWriteContract();

  const { isLoading: isSubmitConfirming, isSuccess: isSubmitConfirmed } =
    useWaitForTransactionReceipt({ hash: submitHash });

  const submitScore = useCallback(
    (score: number) => {
      if (IS_DEMO) return;
      if (!highScore || BigInt(score) > (highScore as bigint)) {
        writeSubmit({
          address: CONTRACT_ADDRESS,
          abi: FRUIT_SLASH_ABI,
          functionName: "submitScore",
          args: [BigInt(score)],
        });
      }
    },
    [writeSubmit, highScore],
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
    isSlashing: isSlashPending || isSlashConfirming,
    isSlashConfirmed,
    slashError,
    mintedTokenId,
    clearMintNotification: () => setMintedTokenId(null),

    // Check-in
    doCheckIn,
    isCheckingIn: isCheckInPending || isCheckInConfirming,
    isCheckInConfirmed,
    checkInError,
    checkedInToday,
    streak,
    totalCheckIns,
    refetchCheckIn,

    // Score
    submitScore,
    isSubmitting: isSubmitPending || isSubmitConfirming,
    isSubmitConfirmed,
    submitError,
    refetchHighScore,
    refetchNFT,
  };
}
