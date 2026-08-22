import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import { knowledgeFields } from '@/config/knowledge-taxonomy';

const accentClasses = {
  orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  blue: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  violet: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
};

export function KnowledgeGateway() {
  return (
    <>
      <section id="knowledge-fields" className="border-y border-foreground/10 bg-background py-20 md:py-24">
        <div className="container mx-auto px-6">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="editorial-kicker"><Compass size={15} /> Bản đồ tri thức</p>
              <h2 className="editorial-title mt-4">Khám phá theo lĩnh vực</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground/65">
                Từ công nghệ cốt lõi đến phương pháp giáo dục, nội dung KingDragonHub được tổ chức thành các lĩnh vực tri thức có liên kết với nhau.
              </p>
            </div>
            <Link href="/blog" className="editorial-text-link">Xem toàn bộ kho tri thức <ArrowRight size={16} /></Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {knowledgeFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <Link
                  key={field.slug}
                  href={`/blog?field=${field.slug}`}
                  className="knowledge-field-card group"
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accentClasses[field.accent]}`}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[10px] text-foreground/30">0{index + 1}</span>
                  </div>
                  <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">{field.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{field.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-foreground/60">{field.description}</p>
                  <p className="mt-6 text-xs leading-6 text-foreground/45">{field.subjects.join(' · ')}</p>
                  <span className="mt-8 flex items-center gap-2 text-sm font-semibold text-foreground transition-colors group-hover:text-brand-orange">
                    Khám phá lĩnh vực <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

    </>
  );
}
