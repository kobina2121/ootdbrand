"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, ImagePlus, MapPin, Ruler, Shirt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const typeOptions = ["Dress", "Top", "Skirt", "Set", "Jumpsuit"] as const;
const categoryOptions = ["MAXI", "MIDI", "MINI", "TOPS"] as const;
const sizeOptions = ["XS", "S", "M", "L", "XL"] as const;
const colorOptions = ["Black", "White", "Wine", "Brown", "Navy", "Olive", "Custom"] as const;
const customOrderDepositGhs = process.env.NEXT_PUBLIC_CUSTOM_ORDER_DEPOSIT_GHS?.trim() || "150";

type DeliveryAddress = {
  addressLine: string;
  city: string;
  stateRegion: string;
  country: string;
};

export default function CustomOrderPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    addressLine: "",
    city: "",
    stateRegion: "",
    country: "Ghana",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoPreview = useMemo(() => {
    if (!photoFile) {
      return "";
    }

    return URL.createObjectURL(photoFile);
  }, [photoFile]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const uploadReferenceImage = async () => {
    if (!photoFile) {
      return undefined;
    }

    const formData = new FormData();
    formData.append("file", photoFile);

    const response = await fetch("/api/uploads/custom-order-image", {
      method: "POST",
      body: formData,
    });
    const json = (await response.json()) as {
      ok: boolean;
      message: string;
      data: { imagePath?: string };
    };

    if (!response.ok || !json.ok || !json.data.imagePath) {
      throw new Error(json.message || "Could not upload reference image.");
    }

    return json.data.imagePath;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !name ||
      !email ||
      !phone ||
      !category ||
      !size ||
      !color ||
      !measurements ||
      !deliveryAddress.addressLine ||
      !deliveryAddress.city ||
      !deliveryAddress.stateRegion ||
      !deliveryAddress.country
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const referenceImage = await uploadReferenceImage();
      const response = await fetch("/api/custom-order/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          type: type.trim() || undefined,
          category,
          size,
          color,
          measurements: measurements.trim(),
          notes: notes.trim() || undefined,
          referenceImage,
          deliveryAddress: {
            addressLine: deliveryAddress.addressLine.trim(),
            city: deliveryAddress.city.trim(),
            stateRegion: deliveryAddress.stateRegion.trim(),
            country: deliveryAddress.country.trim(),
          },
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message: string;
        data: { authorizationUrl?: string };
      };

      if (!response.ok || !json.ok || !json.data.authorizationUrl) {
        throw new Error(json.message || "Could not initialize custom order payment.");
      }

      window.location.assign(json.data.authorizationUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not initialize custom order payment.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="border-black/10 bg-[#f4f3ef] shadow-sm">
        <CardContent className="flex items-start gap-3 p-4 sm:p-5">
          <Clock3 className="mt-0.5 size-5 text-[#3f3a35]" />
          <div>
            <p className="text-sm font-medium text-[#1f1b18]">Production timeline</p>
            <p className="text-sm text-[#6b655f]">Custom orders take 7-14 business days to complete.</p>
            <p className="mt-2 text-sm text-[#1f1b18]">
              Secure custom order slot with a <span className="font-semibold">GHS {customOrderDepositGhs}</span> payment.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/10 bg-white/90 shadow-sm">
        <CardHeader>
          <p className="form-section-title">Custom Atelier</p>
          <CardTitle className="font-heading text-3xl text-[#1f1b18]">Custom Order Request</CardTitle>
          <p className="text-sm text-[#6b655f]">
            Select your preferred style details, add delivery address, and proceed to secure payment.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-4 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 sm:p-5">
              <p className="form-section-title">Customer Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Full Name *</p>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="rounded-xl border-black/15"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Email *</p>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="rounded-xl border-black/15"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Telephone Number *</p>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+233 53 647 7207"
                  className="rounded-xl border-black/15"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 sm:p-5">
              <p className="form-section-title">Style Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Type</p>
                  <select
                    className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    {typeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Category *</p>
                  <select
                    className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Size *</p>
                  <select
                    className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                  >
                    <option value="" disabled>
                      Select size
                    </option>
                    {sizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Color *</p>
                  <select
                    className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                  >
                    <option value="" disabled>
                      Select color
                    </option>
                    {colorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-sm font-medium">
                  <Ruler className="size-4" />
                  Measurements *
                </p>
                <Textarea
                  rows={4}
                  value={measurements}
                  onChange={(event) => setMeasurements(event.target.value)}
                  placeholder="Bust: 34in, Waist: 28in, Hips: 40in, Length: 62in"
                  className="rounded-xl border-black/15"
                />
              </div>
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-sm font-medium">
                  <ImagePlus className="size-4" />
                  Upload a Picture
                </p>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                  className="rounded-xl border-black/15"
                />
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Reference preview"
                    className="h-48 w-full rounded-xl border border-black/10 object-cover sm:w-72"
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 sm:p-5">
              <p className="inline-flex items-center gap-2 text-sm font-medium">
                <MapPin className="size-4" />
                Delivery Address *
              </p>
              <Input
                value={deliveryAddress.addressLine}
                onChange={(event) =>
                  setDeliveryAddress((previous) => ({ ...previous, addressLine: event.target.value }))
                }
                placeholder="Street address / House number"
                className="rounded-xl border-black/15"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={deliveryAddress.city}
                  onChange={(event) => setDeliveryAddress((previous) => ({ ...previous, city: event.target.value }))}
                  placeholder="City"
                  className="rounded-xl border-black/15"
                />
                <Input
                  value={deliveryAddress.stateRegion}
                  onChange={(event) =>
                    setDeliveryAddress((previous) => ({ ...previous, stateRegion: event.target.value }))
                  }
                  placeholder="State / Region"
                  className="rounded-xl border-black/15"
                />
              </div>
              <Input
                value={deliveryAddress.country}
                onChange={(event) => setDeliveryAddress((previous) => ({ ...previous, country: event.target.value }))}
                placeholder="Country"
                className="rounded-xl border-black/15"
              />
            </div>

            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-sm font-medium">
                <Shirt className="size-4" />
                Extra Notes
              </p>
              <Textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Any extra request? Sleeve style, neckline, lining, delivery timeline, etc."
                className="rounded-xl border-black/15"
              />
            </div>

            <Button type="submit" className="rounded-full px-7" disabled={isSubmitting}>
              {isSubmitting ? "Preparing Payment..." : "Proceed to Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
