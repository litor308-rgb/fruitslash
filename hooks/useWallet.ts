"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useWriteContracts } from "wagmi/experimental";
import { CONTRACT_ADDRESS, FRUIT_SLASH_ABI, PAYMASTER_URL } from "@/lib/constants";

const IS_DEMO = CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  const capabilities = PAYMASTER_URL
    ? { paymasterService: { url: PAYMASTER_URL } }
    : undefined;

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

  // --- Slash (EIP-5792 wallet_sendCalls + Paymaster) ---

  const {
    writeContracts: writeSlash,
    data: slashId,
    isPending: isSlashPending,
    error: slashError,
    isSuccess: slashSent,
  } = useWriteContracts();

  const isSlashConfirmed = slashSent;

  useEffect(() => {
    if (slashSent && !hasFruitNFT) {
      const timer = setTimeout(() => {
        refetchNFT().then((result) => {
          if (result.data) setMintedTokenId(1);
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [slashSent, hasFruitNFT, refetchNFT]);

  const doSlash = useCallback(() => {
    if (IS_DEMO) return;
    writeSlash({
      contracts: [
        {
          address: CONTRACT_ADDRESS,
          abi: FRUIT_SLASH_ABI,
          functionName: "slash",
        },
      ],
      capabilities,
    });
  }, [writeSlash, capabilities]);

  // --- Check-in (EIP-5792 wallet_sendCalls + Paymaster) ---

  const {
    writeContracts: writeCheckIn,
    data: checkInId,
    isPending: isCheckInPending,
    error: checkInError,
    isSuccess: checkInSent,
  } = useWriteContracts();

  const isCheckInConfirmed = checkInSent;

  useEffect(() => {
    if (checkInSent) {
      const timer = setTimeout(() => refetchCheckIn(), 3000);
      return () => clearTimeout(timer);
    }
  }, [checkInSent, refetchCheckIn]);

  const doCheckIn = useCallback(() => {
    if (IS_DEMO) return;
    writeCheckIn({
      contracts: [
        {
          address: CONTRACT_ADDRESS,
          abi: FRUIT_SLASH_ABI,
          functionName: "checkIn",
        },
      ],
      capabilities,
    });
  }, [writeCheckIn, capabilities]);

  // --- Submit score (EIP-5792 wallet_sendCalls + Paymaster) ---

  const {
    writeContracts: writeSubmit,
    data: submitId,
    isPending: isSubmitPending,
    error: submitError,
    isSuccess: submitSent,
  } = useWriteContracts();

  const isSubmitConfirmed = submitSent;

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
    totalPlayers: totalPlayers ? Number(totalPlayers) : 0,
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
