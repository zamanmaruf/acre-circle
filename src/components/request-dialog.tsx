"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { NumberInput } from "./number-input";
import { useToast } from "./toast";
import { Button, Field, Modal, Select, Textarea } from "./ui";
import { formatCurrency } from "@/lib/labels";
import { fieldErrors, requestFormSchema } from "@/lib/schemas";
import { useDemoStore } from "@/lib/store";
import type { Property } from "@/lib/types";

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function RequestDialog({ property, open, onClose }: { property: Property; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={`Request a plot at ${property.name}`} subtitle="The owner sees your profile, the area you'd like and your note. Nothing is binding.">
      {open && <RequestForm key={property.id} property={property} onDone={onClose} />}
    </Modal>
  );
}

function RequestForm({ property, onDone }: { property: Property; onDone: () => void }) {
  const { state, actingGrower, setActingGrower, sendRequest, undo } = useDemoStore();
  const toast = useToast();
  const [acres, setAcres] = useState(() => clamp(actingGrower?.desiredAcres ?? property.minPlotAcres, property.minPlotAcres, property.maxPlotAcres));
  const [message, setMessage] = useState(() => (actingGrower ? `Hello! We'd like to grow ${actingGrower.cropType.toLowerCase()} here.` : ""));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const rent = acres * property.rentPerAcreMonthly;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = requestFormSchema(property).safeParse({ requestedAcres: acres, message });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    const out = sendRequest({ propertyId: property.id, ...parsed.data });
    onDone();
    if (out.created) {
      toast({ message: `Request sent to ${property.name}.`, action: { label: "Undo", onClick: undo } });
    } else {
      toast({ message: `You already have a ${out.request.status} request for ${property.name}.` });
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Requesting as" hint="Demo personas. In production this is your signed-in profile.">
        {(id) => (
          <Select id={id} value={state.actingGrowerId} onChange={(e) => setActingGrower(e.target.value)}>
            {state.growers.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.cropType})
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Area you'd like (ac)"
          required
          error={errors.requestedAcres}
          hint={`Owner offers ${property.minPlotAcres.toFixed(2)}–${property.maxPlotAcres.toFixed(2)} ac plots`}
        >
          {(id) => <NumberInput id={id} value={acres} min={0} max={100} onCommit={setAcres} data-testid="request-acres" />}
        </Field>
        <div className="rounded-xl border border-line bg-cream/60 px-4 py-3">
          <p className="text-[12px] text-muted">Indicative rent at the owner&apos;s asking rate</p>
          <p className="mt-1 font-serif text-2xl text-forest">{formatCurrency(rent)}/mo</p>
          <p className="text-[11.5px] text-muted">Final terms are agreed with the owner.</p>
        </div>
      </div>
      <Field label="Note to the owner" required error={errors.message}>
        {(id) => <Textarea id={id} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} data-testid="request-message" />}
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" data-testid="send-request">
          <Send className="h-4 w-4" /> Send request
        </Button>
      </div>
    </form>
  );
}
