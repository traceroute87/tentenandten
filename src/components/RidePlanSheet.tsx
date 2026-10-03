import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { removeBringRidePlan, saveBringRidePlan, useStore, type BringRidePlan } from "../store";
import { Button, Sheet, useToast } from "./ui";

export function RidePlanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [person, setPerson] = useState(1);
  const plans = useStore((s) => s.bringRidePlans);
  const saved = plans[person];
  const [method, setMethod] = useState<BringRidePlan["method"]>("election_day");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMethod(saved?.method ?? "election_day");
    setPickupTime(saved?.pickupTime ?? "");
    setNotes(saved?.notes ?? "");
  }, [open, person, saved]);

  return createPortal((
    <Sheet open={open} onClose={onClose} title="Ride Plan">
      <div className="stack-sm">
        <label className="field">
          <span className="field__label">Person #</span>
          <select className="select" value={person} onChange={(event) => setPerson(Number(event.target.value))}>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
              <option key={number} value={number}>
                Person {number}{plans[number] ? " — Ride planned" : ""}
              </option>
            ))}
          </select>
        </label>
        {saved && <p className="note" role="status">Ride plan saved for Person #{person}.</p>}

        <label className="field">
          <span className="field__label">Voting method</span>
          <select className="select" value={method} onChange={(event) => setMethod(event.target.value as BringRidePlan["method"])}>
            <option value="election_day">Election Day</option>
            <option value="early">Early Voting</option>
          </select>
        </label>

        <label className="field">
          <span className="field__label">Pickup time (optional)</span>
          <input className="input" type="time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">Notes (optional)</span>
          <textarea className="input" rows={3} maxLength={160} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>

        <Button block onClick={() => {
          saveBringRidePlan(person, {
            method,
            ...(pickupTime ? { pickupTime } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
          });
          toast(`Ride plan saved for Person #${person}.`);
          onClose();
        }}>Ride planned</Button>
        {saved && (
          <Button block variant="ghost" onClick={() => {
            removeBringRidePlan(person);
            onClose();
          }}>Cancel ride plan</Button>
        )}
      </div>
    </Sheet>
  ), document.body);
}
