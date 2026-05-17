"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, ImagePlus, Ruler, Shirt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const typeOptions = ["Dress", "Top", "Skirt", "Set", "Jumpsuit"] as const;
const categoryOptions = ["MAXI", "MIDI", "MINI", "TOPS"] as const;
const sizeOptions = ["XS", "S", "M", "L", "XL"] as const;
const colorOptions = ["Black", "White", "Wine", "Brown", "Navy", "Olive", "Custom"] as const;

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !email || !phone || !category || !size || !color || !measurements) {
      toast.error("Please fill in all required fields.");
      return;
    }

    toast.success("Custom order request recorded. We will contact you shortly.");

    setName("");
    setEmail("");
    setPhone("");
    setType("");
    setCategory("");
    setSize("");
    setColor("");
    setMeasurements("");
    setNotes("");
    setPhotoFile(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="border-black/10 bg-[#f4f3ef] shadow-sm">
        <CardContent className="flex items-start gap-3 p-4 sm:p-5">
          <Clock3 className="mt-0.5 size-5 text-[#3f3a35]" />
          <div>
            <p className="text-sm font-medium text-[#1f1b18]">Production timeline</p>
            <p className="text-sm text-[#6b655f]">Custom order takes 7-14 business working days to complete.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/10 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-[#1f1b18]">Custom Order Request</CardTitle>
          <p className="text-sm text-[#6b655f]">
            Select your preferred style details below and upload a reference picture.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Full Name *</p>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Email *</p>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
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
              />
            </div>

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
              />
              {photoPreview ? (
                <img src={photoPreview} alt="Reference preview" className="h-48 w-full rounded-xl border border-black/10 object-cover sm:w-72" />
              ) : null}
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
              />
            </div>

            <Button type="submit" className="rounded-full px-7">
              Submit Custom Order
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
