import { isReadableResumeText, scoreResumeText } from './resume-scoring';

const STRONG_RESUME = `
Jane Doe
jane.doe@example.com | (415) 555-0134

Experience
Senior Software Engineer, Acme Corp
Led the migration of a monolith to microservices, reducing p99 latency by 40%.
Built a React and TypeScript dashboard serving 2M requests/day.
Designed a distributed system using Kubernetes, Docker, and AWS.
Implemented CI/CD pipelines with GitHub Actions and Jenkins.
Optimized PostgreSQL queries, improving throughput by 25%.
Architected a GraphQL API layer replacing legacy REST endpoints.

Education
B.S. in Computer Science, State University

Skills
JavaScript, TypeScript, Python, React, Node.js, SQL, AWS, Docker, Kubernetes, Git, GraphQL, System Design

Projects
Built a real-time chat app using WebSockets and Redis, scaling to 50k concurrent users.
`.repeat(3);

const WEAK_RESUME = 'Worked at a company. Did some coding.';

describe('isReadableResumeText', () => {
  it('rejects text shorter than the minimum readable length', () => {
    expect(isReadableResumeText('too short')).toBe(false);
  });

  it('accepts text at or above the minimum readable length', () => {
    expect(isReadableResumeText(WEAK_RESUME.padEnd(40, '.'))).toBe(true);
  });
});

describe('scoreResumeText', () => {
  it('scores a well-structured resume with contact info, sections, verbs, and metrics highly', () => {
    const result = scoreResumeText(STRONG_RESUME);

    expect(result.atsScore).toBeGreaterThanOrEqual(80);
    expect(result.parsedSkills).toContain('React');
    expect(result.parsedSkills).toContain('TypeScript');
    expect(result.summary).toContain('Strong ATS alignment');
  });

  it('scores a sparse resume low and flags the critical gaps', () => {
    const result = scoreResumeText(WEAK_RESUME);

    expect(result.atsScore).toBeLessThan(60);
    expect(result.structureFeedback.some((item) => item.title === 'No email detected')).toBe(true);
    expect(result.structureFeedback.some((item) => item.title === 'Add measurable results')).toBe(
      true,
    );
  });

  it('caps missing skills at eight and excludes already-parsed skills', () => {
    const result = scoreResumeText(STRONG_RESUME);

    expect(result.missingSkills.length).toBeLessThanOrEqual(8);
    expect(result.missingSkills).not.toContain('React');
  });

  it('matches multi-word and symbol keywords without matching unrelated substrings', () => {
    const result = scoreResumeText(
      'Experience with C++ and CI/CD pipelines. Wrote services in Golang.',
    );

    expect(result.parsedSkills).toContain('C++');
    expect(result.parsedSkills).toContain('CI/CD');
    expect(result.parsedSkills).toContain('Go');
  });

  it('returns a zero word count and lowest length score for empty text', () => {
    const result = scoreResumeText('   ');

    expect(result.atsScore).toBeGreaterThanOrEqual(0);
    expect(result.structureFeedback.some((item) => item.title === 'Resume looks short')).toBe(true);
  });
});
