'use client';

import React from 'react';
import { computeEditorialReport, type EditorialReportBucket } from '@/lib/content/editorial-plan';
import type { EditorialWeek } from '@/lib/content/editorial-week';

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-muted">
        <span>{label}</span>
        <span className="font-orbitron text-foreground">{value}</span>
      </div>
      <div className="h-2 bg-brand-orange/15">
        <div className="h-2 bg-brand-orange" style={{ width: `${value ? width : 0}%` }} />
      </div>
    </div>
  );
}

function BucketChart({
  title,
  buckets,
  valueKey,
}: {
  title: string;
  buckets: EditorialReportBucket[];
  valueKey: keyof EditorialReportBucket;
}) {
  const rows = buckets.slice(0, 12);
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  return (
    <div className="editorial-report-card space-y-3">
      <p className="text-sm font-semibold">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Chưa có dữ liệu.</p>
      ) : (
        rows.map((row) => (
          <Bar key={row.key} label={row.label} value={Number(row[valueKey]) || 0} max={max} />
        ))
      )}
    </div>
  );
}

export function EditorialPerformanceReport({ weeks }: { weeks: EditorialWeek[] }) {
  const report = computeEditorialReport(weeks);
  const { performance, chatgpt, range } = report;

  return (
    <section className="editorial-report space-y-5" aria-labelledby="editorial-report-title">
      <div>
        <h2 id="editorial-report-title" className="text-base font-semibold">
          Báo cáo hiệu quả ChatGPT
        </h2>
        <p className="text-xs text-muted mt-1">
          {range.weeks} tuần trên bàn duyệt
          {range.from ? ` · từ ${range.from}` : ''}
          {range.to ? ` đến ${range.to}` : ''}
          . Không gồm bài viết tự do ngoài lịch tuần.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          [`${chatgpt.week_plans}`, 'Lần GPT gửi lịch tuần'],
          [`${chatgpt.week_revises + chatgpt.slot_revises}`, 'Lần GPT hiệu chỉnh brief'],
          [`${chatgpt.articles_rejected}`, 'Lần admin trả draft'],
          [`${chatgpt.first_pass_rate}%`, 'Tuần duyệt luôn (không GPT sửa lại)'],
        ].map(([value, hint]) => (
          <div key={hint} className="editorial-kpi editorial-kpi--compact">
            <p className="editorial-kpi__value">{value}</p>
            <p className="editorial-kpi__label">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="editorial-report-card space-y-2">
          <p className="text-sm font-semibold">Kết quả việc</p>
          <p className="text-sm">Lập lịch — duyệt: {performance.planning.passed} · hủy: {performance.planning.failed} · đang xem: {performance.planning.in_review}</p>
          <p className="text-sm">Trung bình số bản (mọi lần bump): {performance.planning.avg_revisions}</p>
          <p className="text-sm">GPT sửa tuần: {chatgpt.week_revises} · GPT sửa từng bài: {chatgpt.slot_revises}</p>
          <p className="text-sm">Viết — nháp chờ đọc: {performance.writing.drafted} · đăng: {performance.writing.published} · trả draft: {performance.writing.rejected}</p>
          <p className="text-sm">Lỗi gửi draft: {performance.writing.write_fails}{performance.writing.avg_seo != null ? ` · SEO TB: ${performance.writing.avg_seo}` : ''}</p>
          <p className="text-sm font-semibold">Tỉ lệ duyệt tuần: {performance.planning.pass_rate}% · Tỉ lệ đăng / bài đã viết: {performance.writing.pass_rate}%</p>
        </div>
        <BucketChart title="GPT hiệu chỉnh brief theo tuần ISO" buckets={report.by_week} valueKey="chatgpt_revises" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BucketChart title="Bài đã đăng theo tuần ISO" buckets={report.by_week} valueKey="published" />
        <BucketChart title="Bài đã đăng theo tháng" buckets={report.by_month} valueKey="published" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BucketChart title="Tuần được duyệt theo tháng" buckets={report.by_month} valueKey="approved" />
        <BucketChart title="Draft bị trả theo tuần ISO" buckets={report.by_week} valueKey="rejected" />
      </div>
    </section>
  );
}
