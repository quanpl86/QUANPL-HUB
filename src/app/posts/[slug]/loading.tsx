export default function PostLoading() {
  return (
    <main className="min-h-screen bg-background px-6 pb-24 pt-32" aria-busy="true" aria-label="Đang tải bài viết">
      <div className="mx-auto max-w-[1200px] animate-pulse">
        <div className="h-3 w-64 rounded bg-foreground/10" />
        <div className="mt-10 h-16 max-w-4xl rounded bg-foreground/10 md:h-24" />
        <div className="mt-5 h-6 max-w-3xl rounded bg-foreground/[0.07]" />
        <div className="mt-10 h-10 w-72 rounded bg-foreground/[0.07]" />
        <div className="mt-14 aspect-video w-full rounded bg-foreground/[0.06]" />
      </div>
    </main>
  );
}
