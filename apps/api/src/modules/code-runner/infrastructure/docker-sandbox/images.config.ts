import { ProblemLanguage } from '../../../problem/domain/entities/problem';

export interface LanguageImageConfig {
  image: string;
  compile: string[] | null;
  run: string[];
  memoryMb: number | null;
  compileMemoryMb: number;
  compileTimeoutMs: number;
  startupSlackMs: number;
  pidsLimit: number;
}

export const DEFAULT_GO_SANDBOX_IMAGE = 'elevatesde/sandbox-go:1.23';

const BASE_LIMITS = {
  memoryMb: null,
  compileMemoryMb: 512,
  compileTimeoutMs: 20000,
  startupSlackMs: 0,
  pidsLimit: 64,
};

export function buildLanguageImages(
  env: NodeJS.ProcessEnv = process.env,
): Record<ProblemLanguage, LanguageImageConfig> {
  return {
    javascript: {
      ...BASE_LIMITS,
      image: 'node:20-alpine',
      compile: null,
      run: ['node', '/sandbox/main.js'],
    },
    python: {
      ...BASE_LIMITS,
      image: 'python:3.12-alpine',
      compile: null,
      run: ['python3', '/sandbox/main.py'],
    },
    cpp: {
      ...BASE_LIMITS,
      image: 'gcc:13',
      compile: ['g++', '-O2', '-std=c++17', '/sandbox/main.cpp', '-o', '/sandbox/main.bin'],
      run: ['/sandbox/main.bin'],
    },
    java: {
      ...BASE_LIMITS,
      image: 'eclipse-temurin:21-jdk-alpine',
      compile: [
        'javac',
        '-J-XX:+UseSerialGC',
        '-encoding',
        'UTF-8',
        '-d',
        '/sandbox',
        '/sandbox/Main.java',
      ],
      run: [
        'java',
        '-XX:+UseSerialGC',
        '-XX:-UsePerfData',
        '-Xss64m',
        '-Xmx256m',
        '-cp',
        '/sandbox',
        'Main',
      ],
      memoryMb: 512,
      startupSlackMs: 2000,
      pidsLimit: 128,
    },
    go: {
      ...BASE_LIMITS,
      image: env.SANDBOX_GO_IMAGE || DEFAULT_GO_SANDBOX_IMAGE,
      compile: ['go', 'build', '-o', '/sandbox/main.bin', '/sandbox/main.go'],
      run: ['/sandbox/main.bin'],
      compileTimeoutMs: 30000,
    },
  };
}

export const LANGUAGE_IMAGES = buildLanguageImages();
