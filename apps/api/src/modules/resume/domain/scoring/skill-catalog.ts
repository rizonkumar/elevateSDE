export interface SkillDefinition {
  name: string;
  keywords: string[];
}

export const SDE_SKILLS: SkillDefinition[] = [
  { name: 'JavaScript', keywords: ['javascript', 'js', 'es6'] },
  { name: 'TypeScript', keywords: ['typescript', 'ts'] },
  { name: 'React', keywords: ['react', 'react.js', 'reactjs'] },
  { name: 'Node.js', keywords: ['node.js', 'nodejs', 'node'] },
  { name: 'Python', keywords: ['python'] },
  { name: 'Java', keywords: ['java'] },
  { name: 'Go', keywords: ['golang'] },
  { name: 'C++', keywords: ['c++'] },
  { name: 'SQL', keywords: ['sql', 'postgresql', 'postgres', 'mysql'] },
  { name: 'NoSQL', keywords: ['mongodb', 'dynamodb', 'redis', 'cassandra'] },
  { name: 'AWS', keywords: ['aws', 'amazon web services'] },
  { name: 'Docker', keywords: ['docker'] },
  { name: 'Kubernetes', keywords: ['kubernetes', 'k8s'] },
  { name: 'CI/CD', keywords: ['ci/cd', 'continuous integration', 'github actions', 'jenkins'] },
  { name: 'GraphQL', keywords: ['graphql'] },
  { name: 'REST APIs', keywords: ['rest', 'restful', 'rest api'] },
  { name: 'Microservices', keywords: ['microservice', 'microservices'] },
  { name: 'System Design', keywords: ['system design', 'distributed systems', 'scalability'] },
  { name: 'Testing', keywords: ['unit test', 'jest', 'playwright', 'pytest', 'integration test'] },
  { name: 'Git', keywords: ['git', 'github', 'gitlab'] },
  { name: 'Data Structures', keywords: ['data structures', 'algorithms'] },
  { name: 'Cloud', keywords: ['gcp', 'azure', 'cloud'] },
];

export const SECTION_HEADINGS = ['experience', 'education', 'skills', 'projects'];

export const ACTION_VERBS = [
  'led',
  'built',
  'designed',
  'developed',
  'implemented',
  'optimized',
  'architected',
  'launched',
  'shipped',
  'improved',
  'reduced',
  'increased',
  'created',
  'automated',
  'scaled',
  'migrated',
  'delivered',
  'owned',
];
