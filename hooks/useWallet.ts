"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, FRUIT_SLASH_ABI } from "@/lib/constants";

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
    isSuccess: slashSent,
  } = useWriteContract();

  const { isSuccess: slashReceiptSuccess } =
    useWaitForTransactionReceipt({ hash: slashHash });

  const isSlashConfirmed = slashSent || slashReceiptSuccess;

  // First slash = NFT mint, detect from hasFruitNFT becoming true
  useEffect(() => {
    if (slashSent && !hasFruitNFT) {
      const timer = setTimeout(() => {
        refetchNFT().then((result) => {
          if (result.data) {
            setMintedTokenId(1);
          }
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [slashSent, hasFruitNFT, refetchNFT]);

  const doSlash = useCallback(() => {
    if (IS_DEMO) return;
    writeSlash({
      address: CONTRACT_ADDRESS,
      abi: FRUIT_SLASH_ABI,
      functionName: "slash",
    });
  }, [writeSlash]);

  // --- Check-in ---

  const {
    writeContract: writeCheckIn,
    data: checkInHash,
    isPending: isCheckInPending,
    error: checkInError,
    isSuccess: checkInSent,
  } = useWriteContract();

  const { isSuccess: checkInReceiptSuccess } =
    useWaitForTransactionReceipt({ hash: checkInHash });

  const isCheckInConfirmed = checkInSent || checkInReceiptSuccess;

  // Refetch check-in data after tx sent
  useEffect(() => {
    if (checkInSent) {
      const timer = setTimeout(() => refetchCheckIn(), 3000);
      return () => clearTimeout(timer);
    }
  }, [checkInSent, refetchCheckIn]);

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
    isSuccess: submitSent,
  } = useWriteContract();

  const { isSuccess: submitReceiptSuccess } =
    useWaitForTransactionReceipt({ hash: submitHash });

  const isSubmitConfirmed = submitSent || submitReceiptSuccess;

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

    doSlash,
    isSlashing: isSlashPending,
    isSlashConfirmed,
    slashError,
    mintedTokenId,
    clearMintNotification: () => setMintedTokenId(null),

    doCheckIn,
    isCheckingIn: isCheckInPending,
    isCheckInConfirmed: isCheckInConfirmed || checkedInToday,
    checkInError,
    checkedInToday,
    streak,
    totalCheckIns,
    refetchCheckIn,

    submitScore,
    isSubmitting: isSubmitPending,
    isSubmitConfirmed,
    submitError,
    refetchHighScore,
    refetchNFT,
  };
}
