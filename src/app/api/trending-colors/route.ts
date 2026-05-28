import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'top'; // top, new, random
    const limitParam = searchParams.get('limit') || '30';
    const limit = parseInt(limitParam, 10);

    // Đường dẫn tới kho dữ liệu nội bộ
    const dataFilePath = path.join(process.cwd(), 'public', 'data', 'trending-palettes.json');
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    let palettes = JSON.parse(fileContents);

    // Xử lý bộ lọc
    if (type === 'new') {
      palettes = palettes.reverse(); // Đảo ngược danh sách (giả lập mới nhất)
    } else if (type === 'random') {
      palettes = palettes.sort(() => Math.random() - 0.5); // Xáo trộn ngẫu nhiên
    }

    // Giới hạn kết quả trả về
    const result = palettes.slice(0, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error reading internal palettes data:', error);
    return NextResponse.json(
      [{ id: 1, title: 'Error Loading Data', author: 'System', colors: ['#FF0000', '#000000'] }],
      { status: 500 }
    );
  }
}
