export default function RequestError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-400/40 bg-dark-1 p-6 text-white"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          className="mt-4 rounded bg-blue-1 px-5 py-2 focus-visible:outline focus-visible:outline-2"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}
