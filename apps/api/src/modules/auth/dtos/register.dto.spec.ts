import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

async function passwordErrors(password: string): Promise<number> {
  const dto = plainToInstance(RegisterDto, { email: 'a@example.com', password });
  const errors = await validate(dto);
  return errors.filter((error) => error.property === 'password').length;
}

describe('RegisterDto password policy', () => {
  it.each(['short1', 'onlyletterspass', '1234567890'])('rejects %s', async (password) => {
    expect(await passwordErrors(password)).toBe(1);
  });

  it('accepts a long password with letters and numbers', async () => {
    expect(await passwordErrors('correct-horse-42')).toBe(0);
  });
});
