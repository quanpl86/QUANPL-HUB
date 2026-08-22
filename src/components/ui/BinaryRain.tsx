'use client';

import type { CSSProperties } from 'react';

const columns = [
  { value: '010110010101101001011001', x: '4%', duration: '11.5s', delay: '-8.2s' },
  { value: '101001011010010110100101', x: '15%', duration: '14s', delay: '-3.7s' },
  { value: '001101010011010100110101', x: '28%', duration: '12.5s', delay: '-10.1s' },
  { value: '110010110100101101001011', x: '41%', duration: '15.5s', delay: '-6.4s' },
  { value: '011010011001011010011001', x: '54%', duration: '13s', delay: '-1.9s' },
  { value: '100101100110100101100110', x: '66%', duration: '16s', delay: '-12.3s' },
  { value: '010011010110010011010110', x: '78%', duration: '12s', delay: '-5.2s' },
  { value: '101100101001101100101001', x: '89%', duration: '14.5s', delay: '-9.6s' },
];

type BinaryStyle = CSSProperties & {
  '--binary-x': string;
  '--binary-duration': string;
  '--binary-delay': string;
};

export function BinaryRain() {
  return (
    <div className="hero-binary-rain" aria-hidden="true">
      {columns.map((column, index) => (
        <span
          key={`${column.x}-${column.value}`}
          className="hero-binary-column"
          style={{
            '--binary-x': column.x,
            '--binary-duration': column.duration,
            '--binary-delay': column.delay,
          } as BinaryStyle}
        >
          {column.value.split('').map((character, characterIndex) => (
            <i key={`${index}-${characterIndex}`}>{character}</i>
          ))}
        </span>
      ))}
    </div>
  );
}
