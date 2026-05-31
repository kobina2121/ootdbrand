import { connectToDatabase } from "@/lib/db/mongoose";
import { PaymentEventModel } from "@/lib/db/models/payment-event";

export function buildPaymentEventKey(reference: string, eventType: string) {
  return `${reference}:${eventType}`;
}

export async function hasPaymentEvent(eventKey: string) {
  await connectToDatabase();

  const count = await PaymentEventModel.countDocuments({ eventKey }).limit(1);
  return count > 0;
}

export async function recordPaymentEvent(input: {
  reference: string;
  eventType: string;
  payload: unknown;
  verified: boolean;
}) {
  await connectToDatabase();

  const eventKey = buildPaymentEventKey(input.reference, input.eventType);

  const event = await PaymentEventModel.findOneAndUpdate(
    { eventKey },
    {
      $setOnInsert: {
        reference: input.reference,
        eventType: input.eventType,
        eventKey,
      },
      $set: {
        payload: input.payload,
        verified: input.verified,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return {
    id: String(event._id),
    reference: event.reference,
    eventKey,
  };
}
