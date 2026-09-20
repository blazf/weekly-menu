/** The voting flow is used by the whole family, mostly on phones. Wide column
 *  so many dishes fit at once — two per row on desktop — with room at the
 *  bottom for the floating submit button. */
export default function VoteLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-32">{children}</div>;
}
