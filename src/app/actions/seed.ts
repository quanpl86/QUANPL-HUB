'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { checkAdmin } from '@/lib/auth-utils';

export async function seedCategories() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const categories = [
    { name: 'STEM Education', slug: 'stem-education', description: 'Kiến thức về Khoa học, Công nghệ, Kỹ thuật và Toán học.' },
    { name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'Khám phá thế giới trí tuệ nhân tạo và Machine Learning.' },
    { name: 'Robotics & Hardware', slug: 'robotics-hardware', description: 'Chế tạo robot, mạch điện tử và phần cứng.' },
    { name: '3D Design & Printing', slug: '3d-design-printing', description: 'Thiết kế 3D, in 3D và mô phỏng kỹ thuật.' },
    { name: 'Full-stack Development', slug: 'fullstack-development', description: 'Lập trình Web và ứng dụng hiện đại.' },
  ];

  const { data, error } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' });

  if (error) {
    console.error('Error seeding categories:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
