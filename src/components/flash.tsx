// Fehler-/Erfolgsmeldung aus ?error= bzw. ?message= in der URL.
export function Flash({ error, message }: { error?: string; message?: string }) {
  return (
    <>
      {error && <p className="alert-error mb-4">{error}</p>}
      {message && <p className="alert-success mb-4">{message}</p>}
    </>
  );
}
