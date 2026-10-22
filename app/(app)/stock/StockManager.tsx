"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { addStockAction, deleteStockAction, editStockAction } from "@/app/actions/stock";
import { formatKg, formatNaira } from "@/lib/format";

export interface StockRowView {
  id: string;
  crop: string;
  label: string;
  unitLabel: string;
  qtyKg: number;
  note: string | null;
  priceKobo: number | null;
  valueKobo: number | null;
}

export interface CropOption {
  crop: string;
  label: string;
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#101828]/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-dialog-title"
        className="w-full max-w-md rounded-dialog bg-surface p-5 shadow-[0_12px_24px_-4px_rgba(16,24,40,.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="stock-dialog-title" className="text-xl font-semibold">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-input border border-loss-line bg-loss-bg px-3 py-2 text-loss-text">
      {message}
    </p>
  );
}

export function StockManager({
  rows,
  crops,
}: {
  rows: StockRowView[];
  crops: CropOption[];
}) {
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [editing, setEditing] = useState<StockRowView | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

  const [deleting, setDeleting] = useState<StockRowView | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setAddError(null);
    setNotice(null);
    setAddPending(true);
    try {
      const result = await addStockAction(new FormData(form));
      if (result.error) {
        setAddError(result.error);
      } else {
        form.reset();
        setNotice("Stock added.");
      }
    } finally {
      setAddPending(false);
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setEditError(null);
    setEditPending(true);
    try {
      const result = await editStockAction(new FormData(form));
      if (result.error) {
        setEditError(result.error);
      } else {
        setEditing(null);
        setNotice("Stock updated.");
      }
    } finally {
      setEditPending(false);
    }
  }

  async function onDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setDeleteError(null);
    setDeletePending(true);
    try {
      const result = await deleteStockAction(new FormData(form));
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setDeleting(null);
        setNotice("Stock deleted.");
      }
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="add-stock-title" className="card" id="add-stock">
        <h2 id="add-stock-title" className="text-xl font-semibold">
          Add stock
        </h2>
        <p className="text-ink-muted">Adding a crop you already hold tops up that row.</p>

        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onAdd} noValidate>
          <div>
            <label htmlFor="add-crop" className="label">
              Crop
            </label>
            <select id="add-crop" name="crop" className="input" defaultValue="">
              <option value="" disabled>
                Choose a crop
              </option>
              {crops.map((option) => (
                <option key={option.crop} value={option.crop}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="add-qty" className="label">
              Quantity in kg
            </label>
            <input
              id="add-qty"
              name="qtyKg"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              className="input"
              placeholder="e.g. 250"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="add-note" className="label">
              Note (optional)
            </label>
            <input
              id="add-note"
              name="note"
              type="text"
              maxLength={120}
              className="input"
              placeholder="e.g. Dried, in bags"
            />
          </div>

          <div className="sm:col-span-2 space-y-3">
            <ErrorLine message={addError} />
            <button type="submit" className="btn-primary" disabled={addPending}>
              {addPending ? "Adding…" : "Add stock"}
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="stock-list-title" className="card">
        <h2 id="stock-list-title" className="text-xl font-semibold">
          Your stock
        </h2>

        <p aria-live="polite" className="mt-1 min-h-[24px] text-sm text-optimal-text">
          {notice}
        </p>

        {rows.length === 0 ? (
          <div className="rounded-card border border-line p-6 text-center">
            <p className="font-medium">No stock yet.</p>
            <p className="mt-1 text-ink-muted">Use the form above to add the first crop.</p>
          </div>
        ) : (
          <>
            <div className="mt-2 hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-sm text-ink-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Crop
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Stock
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Today&apos;s price
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Estimated value
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-line align-middle">
                      <td className="py-3 pr-3">
                        <p className="font-medium">{row.label}</p>
                        {row.note && <p className="text-sm text-ink-muted">{row.note}</p>}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{formatKg(row.qtyKg)}</td>
                      <td className="py-3 pr-3 tabular-nums">
                        {row.priceKobo === null
                          ? "Unavailable"
                          : `${formatNaira(row.priceKobo)} / ${row.unitLabel}`}
                      </td>
                      <td className="py-3 pr-3 font-medium tabular-nums">
                        {row.valueKobo === null ? "—" : formatNaira(row.valueKobo)}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn-secondary px-3 text-sm"
                            onClick={() => {
                              setEditError(null);
                              setEditing(row);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-ghost px-3 text-sm text-loss-text hover:text-loss-text"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(row);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-2 space-y-3 md:hidden">
              {rows.map((row) => (
                <li key={row.id} className="rounded-card border border-line p-4">
                  <p className="font-semibold">{row.label}</p>
                  {row.note && <p className="text-sm text-ink-muted">{row.note}</p>}
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Stock</dt>
                      <dd className="tabular-nums">{formatKg(row.qtyKg)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Today&apos;s price</dt>
                      <dd className="tabular-nums">
                        {row.priceKobo === null
                          ? "Unavailable"
                          : `${formatNaira(row.priceKobo)} / ${row.unitLabel}`}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Estimated value</dt>
                      <dd className="font-medium tabular-nums">
                        {row.valueKobo === null ? "—" : formatNaira(row.valueKobo)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary flex-1 px-3 text-sm"
                      onClick={() => {
                        setEditError(null);
                        setEditing(row);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-ghost flex-1 px-3 text-sm text-loss-text hover:text-loss-text"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(row);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {editing && (
        <Modal
          title={`Edit ${editing.label}`}
          onClose={() => setEditing(null)}
        >
          <form key={editing.id} onSubmit={onEdit} noValidate className="space-y-4">
            <input type="hidden" name="id" value={editing.id} />
            <div>
              <label htmlFor="edit-qty" className="label">
                Quantity in kg
              </label>
              <input
                id="edit-qty"
                name="qtyKg"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                defaultValue={editing.qtyKg}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="edit-note" className="label">
                Note (optional)
              </label>
              <input
                id="edit-note"
                name="note"
                type="text"
                maxLength={120}
                defaultValue={editing.note ?? ""}
                className="input"
              />
            </div>

            <ErrorLine message={editError} />

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={editPending}>
                {editPending ? "Saving…" : "Save changes"}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete this stock?" onClose={() => setDeleting(null)}>
          <p>
            <span className="font-medium">{deleting.label}</span>, {formatKg(deleting.qtyKg)} will be
            removed from your stock. This cannot be undone.
          </p>

          <form onSubmit={onDelete} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={deleting.id} />
            <ErrorLine message={deleteError} />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-danger flex-1" disabled={deletePending}>
                {deletePending ? "Deleting…" : "Delete stock"}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setDeleting(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
