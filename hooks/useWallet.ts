"use client";

import { useCallback, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, FRUIT_SLASH_ABI } from "@/lib/constants";

const IS_DEMO = CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const [checkedIn, setCheckedIn] = useState(false);

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

  const {
    writeContract: writeCheckIn,
    data: checkInHash,
    isPending: isCheckingIn,
    error: checkInError,
  } = useWriteContract();

  const { isLoading: isCheckInConfirming, isSuccess: isCheckInConfirmed } =
    useWaitForTransactionReceipt({ hash: checkInHash });

  const {
    writeContract: writeSubmit,
    data: submitHash,
    isPending: isSubmitting,
    error: submitError,
  } = useWriteContract();

  const { isLoading: isSubmitConfirming, isSuccess: isSubmitConfirmed } =
    useWaitForTransactionReceipt({ hash: submitHash });

  const checkIn = useCallback(() => {
    if (IS_DEMO) {
      setCheckedIn(true);
      return;
    }
    writeCheckIn({
      address: CONTRACT_ADDRESS,
      abi: FRUIT_SLASH_ABI,
      functionName: "checkIn",
    });
  }, [writeCheckIn]);

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

  return {
    address,
    isConnected,
    chain,
    highScore: highScore ? Number(highScore) : 0,
    totalPlayers: totalPlayers ? Number(totalPlayers) : IS_DEMO ? 42 : 0,
    checkIn,
    isCheckingIn: isCheckingIn || isCheckInConfirming,
    isCheckInConfirmed: IS_DEMO ? checkedIn : isCheckInConfirmed,
    checkInError,
    submitScore,
    isSubmitting: isSubmitting || isSubmitConfirming,
    isSubmitConfirmed,
    submitError,
    refetchHighScore,
  };
}
