import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (class name utility)', () => {
  it('combina clases simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('maneja valores condicionales', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('resuelve conflictos de Tailwind (tailwind-merge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('maneja undefined y null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('maneja arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('devuelve string vacío sin argumentos', () => {
    expect(cn()).toBe('');
  });
});
