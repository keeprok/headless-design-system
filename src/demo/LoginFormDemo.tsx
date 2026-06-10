import { Button, Input } from '../components';

export function LoginFormDemo() {
  return (
    <div>
      <Input type="text" />
      <Button onClick={() => alert('Login')}>Login</Button>
    </div>
  );
}
