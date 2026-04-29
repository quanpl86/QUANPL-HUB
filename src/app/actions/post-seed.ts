'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { checkAdmin } from '@/lib/auth-utils';

export async function seedDemoPosts() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'User not found' };

  // 1. Get Categories to link properly
  const { data: cats } = await supabase.from('categories').select('id, name');
  const catMap = Object.fromEntries(cats?.map(c => [c.name, c.id]) || []);

  const demoPosts = [
    {
      title: 'The Future of Generative AI in Creative Industries',
      slug: 'future-of-generative-ai-creative-industries',
      excerpt: 'Exploring how AI is reshaping the way we think about art, design, and content creation in the 21st century.',
      content: `<h2>The AI Renaissance</h2><p>Artificial Intelligence is no longer just a tool; it's becoming a collaborator. From generating photorealistic images to composing complex music, generative models like GPT-4 and Midjourney are pushing the boundaries of human creativity.</p><h3>Why it matters for Designers</h3><p>Designers who embrace AI can iterate faster and explore vast creative territories that were previously unreachable.</p>`,
      image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000',
      category_id: catMap['Artificial Intelligence'],
      author_id: user.id,
      is_published: true,
      meta_title: 'Future of Generative AI in Creative Industries | QUAN-PL HUB',
      meta_description: 'Discover how Generative AI is revolutionizing design, art, and the creative industry. Learn how to stay ahead in the AI era.',
      keywords: ['AI', 'Generative AI', 'Creative Industry', 'Machine Learning', 'Design Future']
    },
    {
      title: 'Mastering Logic with Scratch: Building Your First Game',
      slug: 'mastering-logic-with-scratch-first-game',
      excerpt: 'A comprehensive guide for beginners to understand algorithmic thinking by creating a simple platformer in Scratch.',
      content: `<h2>Thinking in Blocks</h2><p>Scratch isn't just for kids; it's a powerful environment to learn the fundamentals of computer science without worrying about syntax.</p><h3>The Game Loop</h3><p>Every game relies on a loop. In Scratch, the "forever" block is your best friend for handling movement and collision detection.</p>`,
      image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
      category_id: catMap['STEM Education'],
      author_id: user.id,
      is_published: true,
      meta_title: 'How to Build Your First Game in Scratch | STEM Guide',
      meta_description: 'Learn the basics of coding and game design with our Scratch tutorial. Perfect for beginners and STEM educators.',
      keywords: ['Scratch', 'Coding for Kids', 'Game Design', 'STEM', 'Algorithms']
    },
    {
      title: 'Unlocking 3D Worlds: Integration of Sketchfab in Modern Web',
      slug: 'unlocking-3d-worlds-sketchfab-web',
      excerpt: 'Bringing the 3rd dimension to your blog. Learn how to embed interactive 3D models seamlessly using Sketchfab.',
      content: `<h2>The Web is No Longer Flat</h2><p>With technologies like WebGL and platforms like Sketchfab, embedding 3D content is as easy as embedding a video.</p><h3>Immersive Storytelling</h3><p>Imagine reading about an engine part and being able to rotate it, zoom in, and see it in 3D right inside the article.</p>`,
      image_url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&q=80&w=1000',
      category_id: catMap['3D Design & Printing'],
      author_id: user.id,
      is_published: true,
      meta_title: 'Embedding 3D Models with Sketchfab | Cyber-Web Guide',
      meta_description: 'Transform your web content with interactive 3D models. Learn how to use Sketchfab for immersive storytelling.',
      keywords: ['3D Design', 'Sketchfab', 'Web Development', 'Interactive Content', 'WebGL']
    },
    {
      title: 'Next.js 16 & React 19: The Dawn of a New Web Era',
      slug: 'nextjs-16-react-19-new-era',
      excerpt: 'Breaking down the most important features of the latest React and Next.js versions for professional developers.',
      content: `<h2>React 19: The Compiler Era</h2><p>The new React Compiler automatically memoizes components, potentially ending the manual useMemo and useCallback era.</p><h3>Next.js 16 Improvements</h3><p>Faster builds, better server component isolation, and enhanced security protocols make Next.js 16 the industry standard.</p>`,
      image_url: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=1000',
      category_id: catMap['Full-stack Development'],
      author_id: user.id,
      is_published: true,
      meta_title: 'Next.js 16 & React 19 Guide | Professional Web Dev',
      meta_description: 'Explore the new features of Next.js 16 and React 19. Learn about the React Compiler and Server Component optimizations.',
      keywords: ['Next.js 16', 'React 19', 'Web Development', 'JavaScript', 'React Compiler']
    },
    {
      title: 'Robotics in 2026: From Industrial Arms to Personal Assistants',
      slug: 'robotics-2026-industrial-to-personal',
      excerpt: 'How robotics technology has evolved from heavy machinery to intelligent companions in our daily lives.',
      content: `<h2>The Rise of Humanoids</h2><p>In 2026, humanoid robots are no longer science fiction. They are assisting in logistics, healthcare, and even elder care.</p><h3>Open Source Hardware</h3><p>Projects like Arduino and Raspberry Pi have democratized robotics, allowing anyone to build sophisticated machines.</p>`,
      image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000',
      category_id: catMap['Robotics & Hardware'],
      author_id: user.id,
      is_published: true,
      meta_title: 'The State of Robotics in 2026 | Hardware & Tech',
      meta_description: 'Understand the latest trends in robotics for 2026. From industrial automation to personal AI-powered assistants.',
      keywords: ['Robotics', 'AI', 'Hardware', 'Arduino', 'Automation']
    },
    {
      title: 'Cyber-Security Essentials: Protecting Your Digital DNA',
      slug: 'cyber-security-protecting-digital-dna',
      excerpt: 'As our lives become fully digital, the importance of robust security measures has never been higher. Are you safe?',
      content: `<h2>Zero Trust Architecture</h2><p>In a world of constant threats, the "Zero Trust" model is essential: never trust, always verify every access request.</p><h3>Multi-Factor Beyond SMS</h3><p>Why physical security keys and biometric authentication are the only ways to truly protect your accounts today.</p>`,
      image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
      category_id: catMap['Full-stack Development'],
      author_id: user.id,
      is_published: true,
      meta_title: 'Cyber-Security Best Practices 2026 | Protect Your Data',
      meta_description: 'Expert guide on protecting your digital identity. Learn about Zero Trust, MFA, and data encryption techniques.',
      keywords: ['Cyber Security', 'Data Privacy', 'Zero Trust', 'Encryption', 'Digital Identity']
    }
  ];

  const { data, error } = await supabase
    .from('posts')
    .upsert(demoPosts, { onConflict: 'slug' });

  if (error) {
    console.error('Error seeding demo posts:', error);
    return { success: false, error: error.message };
  }

  return { success: true, count: demoPosts.length };
}
