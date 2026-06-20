import { ProblemLanguage } from '../../../problem/domain/entities/problem';

export interface LanguageImageConfig {
  image: string;
  compile: string[] | null;
  run: string[];
}

export const LANGUAGE_IMAGES: Record<ProblemLanguage, LanguageImageConfig> = {
  javascript: {
    image: 'node:20-alpine',
    compile: null,
    run: ['node', '/sandbox/main.js'],
  },
  python: {
    image: 'python:3.12-alpine',
    compile: null,
    run: ['python3', '/sandbox/main.py'],
  },
  cpp: {
    image: 'gcc:13',
    compile: ['g++', '-O2', '-std=c++17', '/sandbox/main.cpp', '-o', '/sandbox/main.bin'],
    run: ['/sandbox/main.bin'],
  },
};
