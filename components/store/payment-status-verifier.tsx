"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type PaymentStatusVerifierProps = {
 references: string[];
 maxAttempts?: number;
};

type VerifyResponse = {
 ok?: boolean;
 data?: {
 orderStatus?: "Pending" | "Success" | "Failed";
 };
};

const VERIFY_RETRY_DELAY_MS = 5000;

function wait(ms: number) {
 return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PaymentStatusVerifier({ references, maxAttempts = 1 }: PaymentStatusVerifierProps) {
 const router = useRouter();
 const verifiedKeyRef = useRef("");

 useEffect(() => {
 const uniqueReferences = Array.from(new Set(references.map((reference) => reference.trim()).filter(Boolean)));
 const safeMaxAttempts = Math.max(1, Math.floor(maxAttempts));
 const nextKey = `${uniqueReferences.join("|")}:${safeMaxAttempts}`;

 if (!nextKey || verifiedKeyRef.current === nextKey) {
 return;
 }

 verifiedKeyRef.current = nextKey;
 let isCancelled = false;

 const verifyPendingPayments = async () => {
 let pendingReferences = uniqueReferences;

 for (let attempt = 0; attempt < safeMaxAttempts && pendingReferences.length > 0 && !isCancelled; attempt += 1) {
 const stillPending: string[] = [];

 for (const reference of pendingReferences) {
 try {
 const response = await fetch("/api/paystack/verify", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ reference }),
 });

 if (!response.ok) {
 continue;
 }

 const payload = (await response.json()) as VerifyResponse;
 const orderStatus = payload.data?.orderStatus;

 if (payload.ok && orderStatus && orderStatus !== "Pending") {
 if (!isCancelled) {
 router.refresh();
 }
 return;
 }

 if (payload.ok && orderStatus === "Pending") {
 stillPending.push(reference);
 }
 } catch {
 stillPending.push(reference);
 }
 }

 pendingReferences = stillPending;

 if (pendingReferences.length > 0 && attempt < safeMaxAttempts - 1) {
 await wait(VERIFY_RETRY_DELAY_MS);
 }
 }
 };

 void verifyPendingPayments();

 return () => {
 isCancelled = true;
 };
 }, [maxAttempts, references, router]);

 return null;
}
