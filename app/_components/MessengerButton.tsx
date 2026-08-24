import { messengerUrl } from "@/lib/config";

export default function MessengerButton({
  className = "",
  label = "Message on Facebook",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={messengerUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#0866ff] px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#0655d0] active:scale-[0.99] transition ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.27.57l.05 1.78c.03.57.61.94 1.13.71l1.98-.87c.17-.08.36-.09.54-.04 1 .27 2.06.42 3.13.42 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2Zm6 7.46-2.93 4.65a1.5 1.5 0 0 1-2.17.4l-2.33-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.93-4.65a1.5 1.5 0 0 1 2.17-.4l2.33 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
      </svg>
      {label}
    </a>
  );
}
